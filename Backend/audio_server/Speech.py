from transformers import AutoProcessor, AutoModelForCTC
import torch
import os
from itertools import groupby
import json
import librosa
from flask import current_app as app
from audio_server.utils import compare_texts
from datasets import load_dataset
import numpy as np
from dtaidistance import dtw
from collections import defaultdict
from operator import itemgetter

ds = load_dataset("bookbot/ljspeech_phonemes", split="train")
checkpoint = "speech31/wav2vec2-large-english-TIMIT-phoneme_v3"
model = AutoModelForCTC.from_pretrained(checkpoint)
processor = AutoProcessor.from_pretrained(checkpoint)
sr = processor.feature_extractor.sampling_rate

with open(os.path.join(app.root_path, 'static', "vocab.json"), "r", encoding="utf-8") as file:
    DATA = json.load(file)

num_to_phoneme = {value: key for key, value in DATA.items()}

with open(os.path.join(app.root_path, 'static', "phonemes.json"), "r", encoding="utf-8") as file:
    PHONEMES = json.load(file)

def map_to_phonemes(indices):
    mapped_phonemes = [num_to_phoneme[index.item()] for index in indices if index not in [27, 42, 43]]
    mapped_phonemes = [key for key, _ in groupby(mapped_phonemes)]
    return mapped_phonemes

def find_weak_phonemes(logits, threshold=0.95):
    logits = torch.softmax(logits, dim=-1)
    predicted_phoneme_max_probabilities, predicted_phoneme_indices = torch.max(logits, -1)
    if (predicted_phoneme_max_probabilities < threshold).any():
        weak_phonemes_indices = predicted_phoneme_indices[predicted_phoneme_max_probabilities < threshold]
        return map_to_phonemes(weak_phonemes_indices)
    else:
        return []

def align_sequences(pred_seq, correct_seq):
    alignment = dtw.warping_path(pred_seq, correct_seq)
    return alignment

def find_wrong_phonemes(prediction, correct):
    diff_output, ratio = compare_texts(correct.strip(), prediction.strip())
    return diff_output, ratio

def calculate_posterior(prior, likelihood, marginal):
    return (likelihood * prior) / marginal

def get_phoneme_feedback(correct_phoneme, pred_phoneme, difference, threshold=3):
    if difference > threshold:
        return f"您將 '{correct_phoneme}' 發音為 '{pred_phoneme}'。這兩個音素的發音差異很大。建議：{get_pronunciation_advice(correct_phoneme, pred_phoneme)}"
    else:
        return f"您的 '{correct_phoneme}' 發音接近正確，但與 '{pred_phoneme}' 有些微差異。建議：{get_pronunciation_advice(correct_phoneme, pred_phoneme, minor=True)}"

def get_pronunciation_advice(correct_phoneme, pred_phoneme, minor=False):
    if minor:
        return f"注意 '{correct_phoneme}' 和 '{pred_phoneme}' 的細微差別。{PHONEMES.get(correct_phoneme, '請注意正確的發音方式。')}"
    else:
        return f"請練習 '{correct_phoneme}' 的發音。{PHONEMES.get(correct_phoneme, '請注意正確的發音方式。')}"

def feedback_through_wrong_phonemes(diff):
    feedback = []
    return feedback

def audio_service(url, threshold=0.95, index=1):
    user_audio_array, _ = librosa.load(url, sr=sr)

    inputs = processor(user_audio_array, sampling_rate=sr, return_tensors="pt", padding=True)
    logits = model(inputs["input_values"]).logits
    correct_inputs = processor(ds[index]["audio"]["array"], sampling_rate=sr, return_tensors="pt", padding=True)
    correct_logits = model(correct_inputs["input_values"]).logits

    weak_phonemes = find_weak_phonemes(logits, threshold)
    predicted_ids = torch.argmax(logits, dim=-1)
    correct_predicted_ids = torch.argmax(correct_logits, dim=-1)

    prediction_transcription = processor.batch_decode(predicted_ids)[0]
    correct_transcription = processor.batch_decode(correct_predicted_ids)[0]


    diff, ratio = find_wrong_phonemes(prediction_transcription, correct_transcription)

    feedback = feedback_through_wrong_phonemes(diff)

    return weak_phonemes, prediction_transcription, correct_transcription, diff, feedback, {phoneme: PHONEMES[phoneme] for phoneme in weak_phonemes}, ratio