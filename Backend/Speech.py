from transformers import AutoProcessor, AutoModelForCTC, Wav2Vec2Processor
import librosa
import torch
import numpy as np
from itertools import groupby
from MinMaxNormalizer import MinMaxNormalizer
import json
# from datasets import load_dataset
with open("project\\vocab.json", "r", encoding="utf-8") as file:
    DATA = json.load(file)

def decode_phonemes(ids: torch.Tensor, processor: Wav2Vec2Processor, ignore_stress: bool = False) -> str:
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

def find_weak_phonemes(logits, threshold=0.95):
    logits = torch.softmax(logits, dim=-1)
    predicted_phoneme_max_probabilities, predicted_phoneme_indices = torch.max(logits, -1)
    if (predicted_phoneme_max_probabilities < threshold).any():
        weak_phonemes_indices = predicted_phoneme_indices[predicted_phoneme_max_probabilities < threshold]
    num_to_phoneme = {value: key for key, value in DATA.items()}
    mapped_phonemes = [num_to_phoneme[index.item()] for index in weak_phonemes_indices if index != 0]
    mapped_phonemes = [key for key, _ in groupby(mapped_phonemes)]
    return mapped_phonemes

# Important!! Use this to deploy model!
def audio_service(audio_array):
    audio_array = np.array(audio_array)
    checkpoint = "bookbot/wav2vec2-ljspeech-gruut"
    model = AutoModelForCTC.from_pretrained(checkpoint)
    processor = AutoProcessor.from_pretrained(checkpoint)
    sr = processor.feature_extractor.sampling_rate
    normalizer = MinMaxNormalizer(0, 1)
    # load dummy dataset and read soundfiles
    # ds = load_dataset("patrickvonplaten/librispeech_asr_dummy", "clean", split="validation")
    # audio_array = ds[0]["audio"]["array"]
    # audio_array, _ = librosa.load(path=audio_file, sr=sr)
    norm_array = normalizer.normalize(audio_array)

    inputs = processor(norm_array, return_tensors="pt", padding=True)

    with torch.no_grad():
        logits = model(inputs["input_values"]).logits
    weak_phonemes = find_weak_phonemes(logits)
    predicted_ids = torch.argmax(logits, dim=-1)
    prediction = decode_phonemes(predicted_ids[0], processor)
    return weak_phonemes, prediction