import os
import secrets
from werkzeug.utils import secure_filename
from flask import current_app as app
import difflib
import base64

def save_audio(audio_base64):
    audio_data = base64.b64decode(audio_base64)
    random_hex = secrets.token_hex(8)
    audio_fn = random_hex + '.wav'
    audio_path = os.path.join(app.root_path, 'static/audio', audio_fn)
    with open(audio_path, 'wb') as audio_file:
        audio_file.write(audio_data)

    return audio_path

def compare_texts(correct, prediction):
    """
    Compare two texts and find the differences.
    :param correct: The correct text.
    :param prediction: The predicted text.
    :return: A string displaying the differences.
    """
    # Create a Differ object
    differ = difflib.Differ()
    
    # Compare each word
    diff = list(differ.compare(correct, prediction))
    filtered_diff = [item for item in diff if not item.startswith(' ')]
    
    # Return the formatted differences
    return filtered_diff, difflib.SequenceMatcher(None, correct, prediction).ratio()