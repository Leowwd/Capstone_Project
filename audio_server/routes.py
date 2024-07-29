from flask import request, jsonify, render_template
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
        uri = insertValues["uri"] # input
        index = insertValues["index"] # input
        threshold = insertValues["threshold"] # input
        # if 'file' not in request.files:
        #     return jsonify({'error': 'No file part'})
        # file = request.files['file']
        # threshold = float(request.form['threshold'])
        # if file.filename == '':
        #     return jsonify({'error': 'No selected file'})
        # if file:
        #     audio_path = save_audio(file)
        #     weak_phonemes, predictions, correct, diff_out, ratio = audio_service(audio_path, threshold)
        #     return jsonify({'weak_phonemes': weak_phonemes, 'predictions': predictions, "correct": correct, "diff": diff_out, "accuracy": ratio, "suggestion": "To be implemented"})

        if uri:
            audio_path = save_audio(uri)
            weak_phonemes, predictions, correct, diff_out, ratio = audio_service(audio_path, threshold, index)
            return jsonify({'weak_phonemes': weak_phonemes, 'predictions': predictions, "correct": correct, "diff": diff_out, "accuracy": ratio, "suggestion": "To be implemented"})
    return render_template('upload.html')