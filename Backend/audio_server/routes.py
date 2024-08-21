from flask import request, jsonify
from flask import current_app as app
from audio_server.Speech import audio_service
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
            weak_phonemes, phoneme_differences, prediction, correct, diff_out, feedback, phoneme_info, ratio = audio_service(audio_path, threshold, index)
            if ratio:
                return jsonify({
                    'weak_phonemes': weak_phonemes,
                    'phoneme_differences': phoneme_differences,
                    'prediction': prediction,
                    'correct': correct,
                    'diff_out': diff_out,
                    'feedback': feedback,
                    'phoneme_info': phoneme_info,
                    "ratio": ratio,
                    "state": 1
                })
            else:
                return jsonify({
                    "state": 0 # 重唸
                })