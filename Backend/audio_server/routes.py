from flask import request, jsonify, render_template
from flask import current_app as app
from audio_server.Speech import audio_service, map_phonemes
from audio_server.utils import save_audio

@app.route('/')
@app.route('/index')
def index():
    return 'hello!!'

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        insertValues = request.get_json()
        audio_base64 = insertValues["audio_base64"] # input
        index = insertValues["index"] # input
        threshold = insertValues["threshold"] # input
        if audio_base64:
            audio_path = save_audio(audio_base64)
            weak_phonemes, predictions, correct, diff_out, ratio = audio_service(audio_path, threshold, index)
            phonemes_map = map_phonemes(weak_phonemes)
            return jsonify({'weak_phonemes': weak_phonemes, 'predictions': predictions, "correct": correct, "diff": diff_out, "accuracy": ratio, "phonemes_map": phonemes_map})