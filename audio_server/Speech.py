from transformers import AutoProcessor, AutoModelForCTC, Wav2Vec2Processor
import torch
import os
from itertools import groupby
import json
import librosa
from flask import current_app as app

with open(os.path.join(app.root_path, 'static', "vocab.json"), "r", encoding="utf-8") as file:
    DATA = json.load(file)

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

def audio_service(url, threshold=0.95):
    audio_array, _ = librosa.load(url, sr=16000)
    checkpoint = "speech31/wav2vec2-large-english-TIMIT-phoneme_v3"
    model = AutoModelForCTC.from_pretrained(checkpoint)
    processor = AutoProcessor.from_pretrained(checkpoint)

    inputs = processor(audio_array, return_tensors="pt", padding=True)

    logits = model(inputs["input_values"]).logits
    weak_phonemes = find_weak_phonemes(logits, threshold)
    predicted_ids = torch.argmax(logits, dim=-1)
    prediction = processor.batch_decode(predicted_ids)
    return weak_phonemes, prediction