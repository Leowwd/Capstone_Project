# Speech Analysis Server

This project is a Flask-based web server designed for speech analysis, specifically focusing on identifying weak phonemes in audio files. It leverages deep learning models to process audio data and extract meaningful insights regarding speech clarity and pronunciation.

## Features

- **Phoneme Analysis**: Identify weak phonemes in speech based on a customizable threshold.
- **Audio Processing**: Support for processing audio files uploaded through the web interface or specified via URL.
- **RESTful API**: Easy-to-use API endpoints for uploading audio files and retrieving analysis results.

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Python 3.x
- Flask
- PyTorch
- Other dependencies listed in `requirements.txt`

### Installation

1. Clone the repository to your local machine.
2. Install the required Python packages:

```bash
pip install -r requirements.txt