# app.py
from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
import base64
try:
    from face_detection import detect_facial_features
except ImportError:
    print("Warning: Could not import detect_facial_features. Please ensure the function is correctly defined in face_detection.py")
    def detect_facial_features(image):
        return image  # Fallback that returns the original image
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
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        # Convert the uploaded file to a format usable by OpenCV
        image = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(image, cv2.IMREAD_COLOR)
        
        # Process the image with the facial features detection function
        result_image = detect_facial_features(image)
        
        # Invert the final result
        result_image = cv2.flip(result_image, 1)  # 1 for horizontal flip
        
        # Encode the processed image as a JPEG in memory
        _, buffer = cv2.imencode('.jpg', result_image)
        
        # Convert the image to base64 for response
        result_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({"processed_image": result_base64})
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": "Failed to process image"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
