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
checkpoint = "speech31/wav2vec2-large-english-TIMIT-phoneme_v3"
model = AutoModelForCTC.from_pretrained(checkpoint)
processor = AutoProcessor.from_pretrained(checkpoint)
sr = processor.feature_extractor.sampling_rate

with open(os.path.join(app.root_path, 'static', "vocab.json"), "r", encoding="utf-8") as file:
    DATA = json.load(file)

with open(os.path.join(app.root_path, 'static', "phonemes.json"), "r", encoding="utf-8") as file:
    PHONEMES = json.load(file)

def find_weak_phonemes(logits, threshold=0.95):
    logits = torch.softmax(logits, dim=-1)
    predicted_phoneme_max_probabilities, predicted_phoneme_indices = torch.max(logits, -1)
    if (predicted_phoneme_max_probabilities < threshold).any():
        weak_phonemes_indices = predicted_phoneme_indices[predicted_phoneme_max_probabilities < threshold]
        num_to_phoneme = {value: key for key, value in DATA.items()}
        mapped_phonemes = [num_to_phoneme[index.item()] for index in weak_phonemes_indices if index not in [27, 42, 43]]
        mapped_phonemes = [key for key, _ in groupby(mapped_phonemes)]
    else:
        mapped_phonemes = []
    return mapped_phonemes

def find_wrong_phonemes(prediction, correct):
    diff_output, ratio = compare_texts(correct.strip(), prediction.strip())
    return diff_output, ratio

def audio_service(url, threshold=0.95, index=1):
    user_audio_array, _ = librosa.load(url, sr=sr)
    inputs = processor(user_audio_array, sampling_rate=sr, return_tensors="pt", padding=True)
    logits = model(inputs["input_values"]).logits
    correct_inputs = processor(ds[index]["audio"]["array"], sampling_rate=sr, return_tensors="pt", padding=True)
    correct_logits = model(correct_inputs["input_values"]).logits
    weak_phonemes = find_weak_phonemes(logits, threshold)
    predicted_ids = torch.argmax(logits, dim=-1)
    correct_predicted_ids = torch.argmax(correct_logits, dim=-1)
    prediction = processor.batch_decode(predicted_ids)[0]
    correct = processor.batch_decode(correct_predicted_ids)[0]
    diff_out, ratio = find_wrong_phonemes(prediction[0], correct[0])
    return weak_phonemes, prediction, correct, diff_out, ratio

def map_phonemes(phonemes):
    return {phoneme: PHONEMES[phoneme] for phoneme in phonemes}
