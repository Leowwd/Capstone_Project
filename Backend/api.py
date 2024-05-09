from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from Speech import audio_service
import librosa

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'hello!!'

@app.route("/predict", methods=["POST"])
def get_input():
    data = request.get_json()
    result = audio_service(data["audio"]) # input must be {"audio": audio_array}
    # Just test
    # test_audio_array, _ = librosa.load("C:/Users/ADMIN/OneDrive - 國立臺灣科技大學/文件/Sound Recordings/Recording (7).wav")
    # test_json = jsonify({"audio": test_audio_array.tolist()})
    # json.dump(test_json)
    # test_result = audio_service(test_json["audio"])
    return jsonify({'text': result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)