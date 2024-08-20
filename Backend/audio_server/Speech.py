from transformers import AutoProcessor, AutoModelForCTC, Wav2Vec2Processor
import torch
from scipy.special import softmax
import os
from itertools import groupby
import json
import librosa
from flask import current_app as app
from audio_server.utils import compare_texts
from datasets import load_dataset
import numpy as np

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

def calculate_posterior(prior, likelihood, marginal):
    return (likelihood * prior) / marginal

def audio_service(url, threshold=0.95, index=1):
    user_audio_array, _ = librosa.load(url, sr=sr)
    inputs = processor(user_audio_array, sampling_rate=sr, return_tensors="pt", padding=True)
    logits = model(inputs["input_values"]).logits
    correct_inputs = processor(ds[index]["audio"]["array"], sampling_rate=sr, return_tensors="pt", padding=True)
    correct_logits = model(correct_inputs["input_values"]).logits

    weak_phonemes = find_weak_phonemes(logits, threshold)
    
    predicted_probs = torch.nn.functional.softmax(logits, dim=-1)
    correct_probs = torch.nn.functional.softmax(correct_logits, dim=-1)
    
    predicted_ids = torch.argmax(logits, dim=-1)
    correct_predicted_ids = torch.argmax(correct_logits, dim=-1)
    
    prediction = processor.batch_decode(predicted_ids)[0]
    correct = processor.batch_decode(correct_predicted_ids)[0]
    
    diff_out, ratio = find_wrong_phonemes(prediction, correct)
    
    # Calculate prior (Use correct prediction as prior)
    prior = correct_probs.numpy()
    
    # Calculate likelihood (Use user's prediction as likelihood)
    likelihood = predicted_probs.numpy()
    
    # Calculate marginal
    marginal = np.sum(likelihood * prior, axis=-1, keepdims=True)
    
    # Calculate posterior
    posterior = calculate_posterior(prior, likelihood, marginal)
    
    # Process the differences of phoneme sequences
    phoneme_differences = []
    i = 0
    while i < len(diff_out):
        if diff_out[i].startswith('-') or diff_out[i].startswith('+'):
            correct_phoneme = None
            observed_phoneme = None
            
            if diff_out[i].startswith('-'):
                correct_phoneme = diff_out[i][1:]
                if i + 1 < len(diff_out) and diff_out[i+1].startswith('+'):
                    observed_phoneme = diff_out[i+1][1:]
                    i += 1  # 跳過下一個元素，因為我們已經處理了它
            elif diff_out[i].startswith('+'):
                observed_phoneme = diff_out[i][1:]
                if i + 1 < len(diff_out) and diff_out[i+1].startswith('-'):
                    correct_phoneme = diff_out[i+1][1:]
                    i += 1  # 跳過下一個元素，因為我們已經處理了它

            if correct_phoneme or observed_phoneme:
                correct_index = processor.tokenizer.convert_tokens_to_ids(correct_phoneme) if correct_phoneme else None
                observed_index = processor.tokenizer.convert_tokens_to_ids(observed_phoneme) if observed_phoneme else None

                if correct_index is not None and observed_index is not None:
                    difference = 1 - posterior[0, correct_index]
                elif correct_index is not None:
                    difference = 1 - posterior[0, correct_index]
                elif observed_index is not None:
                    difference = 1  # 完全錯誤（插入了不應該存在的音素）
                else:
                    difference = 0  # 這種情況不應該發生，但為了安全起見

                phoneme_differences.append((correct_phoneme, observed_phoneme, difference))

        i += 1
    
    return weak_phonemes, prediction, correct, diff_out, ratio, phoneme_differences

def map_phonemes(phonemes):
    return {phoneme: PHONEMES[phoneme] for phoneme in phonemes}
