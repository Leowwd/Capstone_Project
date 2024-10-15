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
            weak_phonemes, prediction, correct, feedback, missing, phoneme_info, ratio, extra_timelines = audio_service(audio_path, threshold, index)
            if ratio:
                return jsonify({
                    'weak_phonemes': weak_phonemes,
                    'prediction': prediction,
                    'correct': correct,
                    'feedback': feedback,
                    "missing": missing, 
                    'phoneme_info': phoneme_info,
                    "ratio": ratio,
                    "state": 1,
                    "extra_timelines": extra_timelines
                })
            else:
                return jsonify({
                    "state": 0, # 重唸
                    'weak_phonemes': weak_phonemes,
                    'prediction': prediction,
                    'correct': correct,
                    'feedback': feedback,
                    "missing": missing,
                    'phoneme_info': phoneme_info,
                    "ratio": ratio,
                    "extra_timelines": extra_timelines
                })