from transformers import AutoProcessor, AutoModelForCTC, Wav2Vec2Processor
import torch
import os
from itertools import groupby
import json
import librosa
from flask import current_app as app
from audio_server.utils import compare_texts
from datasets import load_dataset

ds = load_dataset("bookbot/ljspeech_phonemes", split="train")
checkpoint = "bookbot/wav2vec2-ljspeech-gruut"
model = AutoModelForCTC.from_pretrained(checkpoint)
processor = AutoProcessor.from_pretrained(checkpoint)
sr = processor.feature_extractor.sampling_rate

with open(os.path.join(app.root_path, 'static', "vocab.json"), "r", encoding="utf-8") as file:
    DATA = json.load(file)

num_to_phoneme = {value: key for key, value in DATA.items()}

with open(os.path.join(app.root_path, 'static', "phonemes.json"), "r", encoding="utf-8") as file:
    PHONEMES = json.load(file)

def decode_phonemes(
    ids: torch.Tensor, processor: Wav2Vec2Processor, ignore_stress: bool = False
) -> str:
    """CTC-like decoding. First removes consecutive duplicates, then removes special tokens."""
    # removes consecutive duplicates
    ids = [id_ for id_, _ in groupby(ids)]

    special_token_ids = processor.tokenizer.all_special_ids + [
        processor.tokenizer.word_delimiter_token_id
    ]
    # converts id to token, skipping special tokens
    phonemes = [processor.decode(id_) for id_ in ids if id_ not in special_token_ids]

    # joins phonemes
    prediction = " ".join(phonemes)

    # whether to ignore IPA stress marks
    if ignore_stress == True:
        prediction = prediction.replace("ˈ", "").replace("ˌ", "")

    return prediction

def map_to_phonemes(indices):
    mapped_phonemes = [num_to_phoneme[index.item()] for index in indices if index not in [0, 41, 42]]
    mapped_phonemes = list(set([key for key, _ in groupby(mapped_phonemes)]))
    return mapped_phonemes

def find_weak_phonemes(logits, threshold=0.95):
    logits = torch.softmax(logits, dim=-1)
    predicted_phoneme_max_probabilities, predicted_phoneme_indices = torch.max(logits, -1)
    if (predicted_phoneme_max_probabilities < threshold).any():
        weak_phonemes_indices = predicted_phoneme_indices[predicted_phoneme_max_probabilities < threshold]
        return map_to_phonemes(weak_phonemes_indices)
    else:
        return []

def find_wrong_phonemes(prediction, correct):
    diff_output, ratio = compare_texts(correct.strip(), prediction.strip())
    return diff_output, ratio

def feedback_through_wrong_phonemes(diff_out):
    feedback = []
    missing = []
    for diff in diff_out:
        sign, phoneme = diff[0], diff[2:]
        if phoneme in PHONEMES and phoneme != " ":
            info = PHONEMES[phoneme]
            entry = {
                "phoneme": phoneme,
                "error_type": "missing" if sign == '-' else "extra",
                "common_mistake": info['常見錯誤'],
                "correction": {
                    "pronunciation": info['發音'],
                    "mouth_position": info['口腔位置'],
                    "tongue_position": info['舌位']
                }
            }
            if sign == "-":
                missing.append(phoneme)
            feedback.append(entry)
    return feedback, missing

def audio_service(url, threshold=0.95, index=1):

    temp = ds[index]


    temp = ds[index]

    user_audio_array, _ = librosa.load(url, sr=sr)
    inputs = processor(user_audio_array, sampling_rate=sr, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = model(inputs["input_values"]).logits
    
    
    weak_phonemes = find_weak_phonemes(logits, threshold)
    predicted_ids = torch.argmax(logits, dim=-1)

    prediction_transcription = decode_phonemes(predicted_ids[0], processor, ignore_stress=True)
    correct_transcription = temp["phonemes"].replace("ˈ", "").replace("ˌ", "").replace(".", "").strip()
    correct_transcription = temp["phonemes"].replace("ˈ", "").replace("ˌ", "").replace(".", "").strip()
    diff, ratio = find_wrong_phonemes(prediction_transcription, correct_transcription)
    feedback, missing = feedback_through_wrong_phonemes(diff)

    return weak_phonemes, prediction_transcription, correct_transcription, feedback, missing, {phoneme: PHONEMES[phoneme] for phoneme in weak_phonemes}, ratio