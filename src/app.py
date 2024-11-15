# app.py
import os
import logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)

from flask import Flask, request, jsonify, render_template
import numpy as np
import cv2
import base64
from face_detection import detect_skin_irregularities
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import threading

app = Flask(__name__)
executor = ThreadPoolExecutor(max_workers=2)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/detect_face', methods=['POST'])
def detect_face_api():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if not file:
            return jsonify({"error": "No selected file"}), 400

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({"error": "Failed to decode image"}), 400

        # Process image
        result_image, spot_data = detect_skin_irregularities(image)
        
        # Ensure the result is properly encoded
        success, img_encoded = cv2.imencode('.jpg', result_image)
        if not success:
            return jsonify({"error": "Failed to encode result image"}), 500
            
        img_base64 = base64.b64encode(img_encoded).decode('utf-8')
        
        return jsonify({
            "processed_image": img_base64,
            "spots": spot_data,
            "success": True
        })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
