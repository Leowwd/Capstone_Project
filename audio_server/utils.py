import os
import secrets
from werkzeug.utils import secure_filename
from flask import current_app as app
import difflib
from pydub import AudioSegment

def save_audio(file):
    filename = secure_filename(file.filename)
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(filename)
    audio_fn = random_hex + '.wav'
    audio_path = os.path.join(app.root_path, 'static/audio', audio_fn)

    supported_formats = ['.m4a', '.mp3', '.ogg', '.flac']

    if f_ext in supported_formats:
        temp_path = os.path.join(app.root_path, 'static/audio', random_hex + f_ext)
        file.save(temp_path)
        convert_to_wav(temp_path, audio_path)
        os.remove(temp_path)
    else:
        file.save(audio_path)

    return audio_path


def convert_to_wav(input_file, output_file):
    try:
        audio = AudioSegment.from_file(input_file)
        audio.export(output_file, format="wav")
    except Exception as e:
        print(e)

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