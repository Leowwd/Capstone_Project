from flask import Flask
from flask_cors import CORS

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a'}

def create_app():
    app = Flask(__name__, template_folder='templates')
    with app.app_context():
        import audio_server.routes
        CORS(app)
    return app