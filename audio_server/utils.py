import os
import secrets
from flask import current_app as app
from werkzeug.utils import secure_filename
    
def save_audio(file):
    filename = secure_filename(file.filename)
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(filename)
    audio_fn = random_hex + f_ext
    audio_path = os.path.join(app.root_path, 'static/audio', audio_fn)
    file.save(audio_path)
    return audio_path