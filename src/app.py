# app.py
from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
import base64
from face_detection import detect_face  # Ensure this matches your setup
import os

# Change the template folder path
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
app = Flask(__name__, template_folder=template_dir)

# Define the output directory for the processed image
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'output'))
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect_face', methods=['POST'])
def detect_face_api():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    
    # Convert the uploaded file to a format usable by OpenCV
    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # Process the image with the face detection function
    result_image = detect_face(image)
    
    # Encode the processed image as a JPEG in memory
    _, buffer = cv2.imencode('.jpg', result_image)
    
    # Save the processed image to the 'output' folder on the server
    processed_image_path = os.path.join(OUTPUT_DIR, "processed_image.jpg")
    with open(processed_image_path, "wb") as f:
        f.write(buffer)

    # Convert the image to base64 for response
    result_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Return the base64-encoded image
    return jsonify({"processed_image": result_base64})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
