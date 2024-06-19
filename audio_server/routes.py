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
    filename = ''
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'})
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'})
        if file:
            audio_path = save_audio(file)
            weak_phonemes, predictions = audio_service(audio_path)
            return jsonify({'success': 'File uploaded successfully', 'filename': filename, 
                            'weak_phonemes': weak_phonemes, 'predictions': predictions})
    return render_template('upload.html')