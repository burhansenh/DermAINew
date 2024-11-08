# face_detection.py
import mediapipe as mp
import cv2
import numpy as np

def detect_facial_features(image):
    # Initialize MediaPipe Face Mesh
    mp_face_mesh = mp.solutions.face_mesh
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        min_detection_confidence=0.5) as face_mesh:
        
        results = face_mesh.process(image_rgb)
        
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Get image dimensions
                ih, iw, _ = image.shape
                
                # Define facial regions (these are approximate indices for MediaPipe Face Mesh)
                regions = {
                    'forehead': [10, 108, 151, 337, 299],
                    'nose': [1, 2, 98, 327, 331],
                    'left_cheek': [447, 350, 349, 348, 347],
                    'right_cheek': [227, 130, 129, 128, 127],
                    'chin': [152, 175, 371, 399, 400],
                }
                
                # Draw regions on the image
                for region_name, points in regions.items():
                    points_xy = []
                    for point in points:
                        landmark = face_landmarks.landmark[point]
                        x = int(landmark.x * iw)
                        y = int(landmark.y * ih)
                        points_xy.append([x, y])
                    
                    # Convert points to numpy array
                    points_xy = np.array(points_xy, dtype=np.int32)
                    
                    # Draw filled polygon for the region
                    overlay = image.copy()
                    cv2.fillPoly(overlay, [points_xy], (0, 255, 0, 0.3))
                    
                    # Add transparency
                    alpha = 0.4
                    image = cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0)
                    
                    # Add label
                    centroid = np.mean(points_xy, axis=0, dtype=np.int32)
                    cv2.putText(image, region_name, tuple(centroid), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return image
    
    return image  # Return original image if no face detected
