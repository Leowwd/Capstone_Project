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

def decode_phonemes(ids: torch.Tensor, processor: Wav2Vec2Processor, ignore_stress: bool = False, sampling_rate: int = 22500):
    """CTC-like decoding. First removes consecutive duplicates, then removes special tokens."""
    
    # Initialize lists to store phonemes and their timestamps
    phonemes = []
    timestamps = []
    
    # Track the start time of the current phoneme
    start_time = 0
    
    # converts id to token, skipping special tokens
    for i, id_ in enumerate(ids):
        if id_ not in processor.tokenizer.all_special_ids + [processor.tokenizer.word_delimiter_token_id]:
            phoneme = processor.decode(id_)
            if not phonemes or phoneme != phonemes[-1]:
                if phonemes:
                    # Record the end time of the previous phoneme
                    end_time = i / sampling_rate
                    timestamps[-1] = (timestamps[-1][0], end_time)
                phonemes.append(phoneme)
                start_time = i / sampling_rate
                timestamps.append((start_time, None))  # Placeholder for end time
    
    # Record the end time of the last phoneme
    if timestamps:
        timestamps[-1] = (timestamps[-1][0], len(ids) / sampling_rate)
    def decode_phonemes(ids: torch.Tensor, processor: Wav2Vec2Processor, ignore_stress: bool = False, sampling_rate: int = 18000):
        """CTC-like decoding. First removes consecutive duplicates, then removes special tokens."""
        
        # Initialize lists to store phonemes and their timestamps
        phonemes = []
        timestamps = []
        
        # Track the start time of the current phoneme
        start_time = 0
        
        # converts id to token, skipping special tokens
        for i, id_ in enumerate(ids):
            if id_ not in processor.tokenizer.all_special_ids + [processor.tokenizer.word_delimiter_token_id]:
                phoneme = processor.decode(id_)
                if not phonemes or phoneme != phonemes[-1]:
                    if phonemes:
                        # Record the end time of the previous phoneme
                        end_time = i / sampling_rate
                        timestamps[-1] = (timestamps[-1][0], end_time)
                    phonemes.append(phoneme)
                    start_time = i / sampling_rate
                    timestamps.append((start_time, None))  # Placeholder for end time
                else:
                    # Update the end time of the current phoneme
                    timestamps[-1] = (timestamps[-1][0], (i + 1) / sampling_rate)
        
        # Record the end time of the last phoneme
        if timestamps:
            timestamps[-1] = (timestamps[-1][0], len(ids) / sampling_rate)
        
        # joins phonemes
        prediction = " ".join(phonemes)
        
        # whether to ignore IPA stress marks
        if ignore_stress:
            prediction = prediction.replace("ˈ", "").replace("ˌ", "")
        
        return prediction, timestamps
    # joins phonemes
    prediction = " ".join(phonemes)
    
    # whether to ignore IPA stress marks
    if ignore_stress:
        prediction = prediction.replace("ˈ", "").replace("ˌ", "")
    
    return prediction, timestamps
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
    extra = []
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
            if sign == "+":
                extra.append(phoneme)
            feedback.append(entry)
    return feedback, missing, extra

def audio_service(url, threshold=0.95, index=1):
    temp = ds[index]
    
    user_audio_array, _ = librosa.load(url, sr=sr)
    inputs = processor(user_audio_array, sampling_rate=sr, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = model(inputs["input_values"]).logits
    
    weak_phonemes = find_weak_phonemes(logits, threshold)
    predicted_ids = torch.argmax(logits, dim=-1)
    
    prediction_transcription, timestamps = decode_phonemes(predicted_ids[0], processor, ignore_stress=True, sampling_rate=22500)
    correct_transcription = temp["phonemes"].replace("ˈ", "").replace("ˌ", "").replace(".", "").strip()
    diff, ratio = compare_texts(correct_transcription, prediction_transcription)
    feedback, missing, extra = feedback_through_wrong_phonemes(diff)
    
    # Find the timestamps of the extra phonemes
    extra_timestamps = [timestamps[i] for i, phoneme in enumerate(prediction_transcription.split()) if phoneme in extra]
    
    return weak_phonemes, prediction_transcription, correct_transcription, feedback, missing, {phoneme: PHONEMES[phoneme] for phoneme in weak_phonemes}, ratio, extra_timestamps