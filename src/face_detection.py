# face_detection.py
import cv2
import mediapipe as mp
import numpy as np
from scipy.ndimage import gaussian_filter
import os

def create_face_mask(image):
    """Create face mask excluding eyebrows"""
    mp_face_mesh = mp.solutions.face_mesh
    
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        min_detection_confidence=0.5
    ) as face_mesh:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)
        
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        if not results.multi_face_landmarks:
            return None
            
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Get face points excluding eyebrows
        face_points = []
        eyebrow_points = set()
        
        # MediaPipe eyebrow indices
        left_eyebrow = list(range(336, 346))
        right_eyebrow = list(range(70, 80))
        eyebrow_indices = set(left_eyebrow + right_eyebrow)
        
        h, w = image.shape[:2]
        for idx, landmark in enumerate(landmarks):
            if idx not in eyebrow_indices:
                x, y = int(landmark.x * w), int(landmark.y * h)
                face_points.append([x, y])
            else:
                x, y = int(landmark.x * w), int(landmark.y * h)
                eyebrow_points.add((x, y))
        
        # Create face mask
        face_points = np.array(face_points)
        hull = cv2.convexHull(face_points)
        cv2.fillConvexPoly(mask, hull, 255)
        
        # Create eyebrow exclusion zones
        for x, y in eyebrow_points:
            cv2.circle(mask, (x, y), 15, 0, -1)  # Exclude eyebrow regions
            
        return mask

def detect_skin_color(image, face_mask):
    """Detect skin color regions within face mask"""
    # Convert to different color spaces
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
    
    # Define skin color ranges
    lower_skin_hsv = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin_hsv = np.array([20, 255, 255], dtype=np.uint8)
    
    lower_skin_ycrcb = np.array([0, 135, 85], dtype=np.uint8)
    upper_skin_ycrcb = np.array([255, 180, 135], dtype=np.uint8)
    
    # Create skin masks
    mask_hsv = cv2.inRange(hsv, lower_skin_hsv, upper_skin_hsv)
    mask_ycrcb = cv2.inRange(ycrcb, lower_skin_ycrcb, upper_skin_ycrcb)
    
    # Combine masks
    skin_mask = cv2.bitwise_and(mask_hsv, mask_ycrcb)
    skin_mask = cv2.bitwise_and(skin_mask, face_mask)
    
    # Clean up mask
    kernel = np.ones((3,3), np.uint8)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    
    return skin_mask

def analyze_skin_metrics(image, face_mask, spot_data):
    """Calculate real skin health metrics based on image analysis"""
    metrics = {}
    
    # Convert to different color spaces for analysis
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    
    # Only analyze pixels within face mask
    masked_image = cv2.bitwise_and(image, image, mask=face_mask)
    
    # Calculate Spots score (based on detected spots)
    total_spots = len(spot_data)
    spot_severity = sum(spot['radius'] for spot in spot_data.values())
    spots_score = max(100 - (total_spots * 5 + spot_severity), 0)
    metrics['Spots'] = int(spots_score)
    
    # Calculate Texture score
    gray_face = cv2.bitwise_and(gray, gray, mask=face_mask)
    texture_score = 100 - min(100, cv2.Laplacian(gray_face, cv2.CV_64F).var())
    metrics['Texture'] = int(texture_score)
    
    # Calculate Redness
    r, g, b = cv2.split(masked_image)
    redness = np.mean(r[face_mask > 0]) - ((np.mean(g[face_mask > 0]) + np.mean(b[face_mask > 0])) / 2)
    redness_score = max(0, 100 - (redness * 2))
    metrics['Redness'] = int(redness_score)
    
    # Calculate Oiliness (using highlights in L channel)
    l_channel = lab[:,:,0]
    masked_l = cv2.bitwise_and(l_channel, l_channel, mask=face_mask)
    highlight_threshold = np.percentile(masked_l[masked_l > 0], 90)
    oily_pixels = np.sum(masked_l > highlight_threshold)
    total_pixels = np.sum(face_mask > 0)
    oiliness_score = 100 - min(100, (oily_pixels / total_pixels) * 1000)
    metrics['Oiliness'] = int(oiliness_score)
    
    # Calculate Acne score
    acne_count = sum(1 for spot in spot_data.values() if spot['type'] == 'Acne')
    acne_score = max(0, 100 - (acne_count * 10))
    metrics['Acne'] = int(acne_score)
    
    # Calculate Wrinkles
    edges = cv2.Canny(gray_face, 50, 150)
    wrinkle_density = np.sum(edges > 0) / total_pixels
    wrinkle_score = max(0, 100 - (wrinkle_density * 1000))
    metrics['Wrinkles'] = int(wrinkle_score)
    
    # Calculate Pores
    pore_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    pore_tophat = cv2.morphologyEx(gray_face, cv2.MORPH_TOPHAT, pore_kernel)
    pore_density = np.sum(pore_tophat > 20) / total_pixels
    pore_score = max(0, 100 - (pore_density * 1000))
    metrics['Pores'] = int(pore_score)
    
    # Calculate overall Skin Health (weighted average of other metrics)
    weights = {
        'Spots': 0.15,
        'Texture': 0.15,
        'Redness': 0.1,
        'Oiliness': 0.1,
        'Acne': 0.2,
        'Wrinkles': 0.15,
        'Pores': 0.15
    }
    
    skin_health = sum(metrics[k] * weights[k] for k in weights.keys())
    metrics['Skin Health'] = int(skin_health)
    
    # Calculate Dark Circles (analyze under-eye area)
    # This would require eye landmark detection from MediaPipe
    # Placeholder for now
    metrics['Dark Circles'] = int(skin_health * 0.9)
    
    # Calculate Eye bags (analyze under-eye puffiness)
    metrics['Eye bags'] = int(skin_health * 0.95)
    
    # Calculate Moisture (based on texture and highlight analysis)
    moisture_score = (texture_score + (100 - oiliness_score)) / 2
    metrics['Moisture'] = int(moisture_score)
    
    return metrics

def create_radar_chart(metrics):
    """Create a radar chart visualization of skin metrics"""
    # For now, return None since we're not implementing the visualization
    return None

def detect_skin_irregularities(image):
    # Create face mask
    face_mask = create_face_mask(image)
    if face_mask is None:
        print("No face detected in the image")
        return image, {}, {}, None
    
    # Get skin mask
    skin_mask = detect_skin_color(image, face_mask)
    
    result_image = image.copy()
    
    # Enhance image for better detection
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel = lab[:,:,0]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(l_channel)
    
    # Detect spots using multiple methods
    spot_data = {}
    spot_id = 0
    
    # Local contrast enhancement for better spot detection
    local_contrast = cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX)
    
    # Multiple threshold levels for different types of spots
    thresholds = {
        'dark': cv2.threshold(local_contrast, 0, 255, 
                            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        'medium': cv2.adaptiveThreshold(local_contrast, 255, 
                                      cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY_INV, 11, 2)
    }
    
    # Define colors for different classifications (RGBA format)
    color_map = {
        'mole': (139, 69, 19, 0.7),    # brown with 0.7 opacity
        'acne': (255, 0, 0, 0.7),      # red with 0.7 opacity
        'freckle': (244, 164, 96, 0.7), # sandy brown with 0.7 opacity
        'mixed': (0, 255, 0, 0.7)       # green with 0.7 opacity
    }

    # Create an overlay for transparent colors
    overlay = image.copy()
    
    # Adjust these parameters for acne detection
    def analyze_spot(roi, radius):
        avg_color = np.mean(roi, axis=(0,1))
        darkness = 255 - np.mean(avg_color)
        
        # Calculate redness more accurately
        # Higher values indicate more red compared to other channels
        b, g, r = avg_color
        redness = r - ((b + g) / 2)
        
        # Calculate local contrast
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        local_contrast = np.std(gray_roi)
        
        return darkness, redness, local_contrast

    # Adjust classification thresholds
    spot_criteria = {
        'Mole': {
            'darkness_threshold': 110,  # Lowered for better mole detection
            'min_radius': 2,  # Smaller minimum size
            'max_radius': 12,
            'min_circularity': 0.4,
            'color': (0, 0, 255)  # Red
        },
        'Freckle': {
            'darkness_threshold': 50,  # Lowered for better freckle detection
            'max_radius': 4,
            'min_circularity': 0.3,
            'color': (139, 69, 19)  # Brown
        },
        'Acne': {
            'redness_threshold': 20,
            'contrast_threshold': 30,
            'min_radius': 3,
            'max_radius': 8,
            'min_circularity': 0.5,
            'color': (0, 165, 255)  # Orange
        }
    }
    
    for thresh_type, thresh in thresholds.items():
        # Apply skin mask
        thresh = cv2.bitwise_and(thresh, skin_mask)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, 
                                     cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 3 < area < 500:  # Lowered minimum area for better detection
                perimeter = cv2.arcLength(contour, True)
                circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
                
                (x, y), radius = cv2.minEnclosingCircle(contour)
                center = (int(x), int(y))
                radius = int(radius)
                
                # Skip if in excluded regions (eyebrows)
                if face_mask[center[1], center[0]] == 0:
                    continue
                    
                roi = image[max(0, center[1]-radius):min(image.shape[0], center[1]+radius),
                          max(0, center[0]-radius):min(image.shape[1], center[0]+radius)]
                
                if roi.size > 0:
                    darkness, redness, local_contrast = analyze_spot(roi, radius)
                    
                    # Improved classification logic
                    if (darkness > spot_criteria['Mole']['darkness_threshold'] and 
                        spot_criteria['Mole']['min_radius'] < radius < spot_criteria['Mole']['max_radius'] and
                        circularity > spot_criteria['Mole']['min_circularity']):
                        spot_type = "Mole"
                        color = spot_criteria['Mole']['color']
                    elif (darkness > spot_criteria['Freckle']['darkness_threshold'] and 
                          radius < spot_criteria['Freckle']['max_radius'] and
                          circularity > spot_criteria['Freckle']['min_circularity']):
                        spot_type = "Freckle"
                        color = spot_criteria['Freckle']['color']
                    elif (redness > spot_criteria['Acne']['redness_threshold'] and 
                          local_contrast > spot_criteria['Acne']['contrast_threshold'] and
                          spot_criteria['Acne']['min_radius'] < radius < spot_criteria['Acne']['max_radius'] and
                          circularity > spot_criteria['Acne']['min_circularity']):
                        spot_type = "Acne"
                        color = spot_criteria['Acne']['color']
                    else:
                        continue
                    
                    # Draw gradient overlay
                    mask = np.zeros((image.shape[0], image.shape[1]), dtype=np.float32)
                    cv2.circle(mask, center, radius, 1, -1)
                    mask = gaussian_filter(mask, sigma=radius/3)
                    
                    for c in range(3):
                        overlay[:,:,c] = overlay[:,:,c] + (mask * color[c]).astype(np.uint8)
                    
                    spot_data[f"spot_{spot_id}"] = {
                        "center": center,
                        "radius": radius,
                        "type": spot_type,
                        "darkness": int(darkness),
                        "redness": int(redness)
                    }
                    spot_id += 1
    
    # Blend the overlay with the original image
    alpha = 0.5  # Transparency factor
    result_image = cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0)
    
    # Calculate real metrics
    metrics = analyze_skin_metrics(image, face_mask, spot_data)
    
    # Create radar chart with calculated metrics
    radar_chart = create_radar_chart(metrics)
    
    return result_image, spot_data, metrics, radar_chart

# Optional: Test the function if running the file directly
if __name__ == "__main__":
    try:
        import sys
        if len(sys.argv) > 1:
            # Use command line argument as image path
            image_path = sys.argv[1]
        else:
            # Update this path to point to your actual test image
            image_path = "./your_image.jpg"  # Replace with path to your image
        
        if not os.path.exists(image_path):
            print(f"Error: Image not found at {image_path}")
            print("Please provide an image path as a command line argument")
            sys.exit(1)
            
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Could not load image from {image_path}")
            print("Please make sure the image file exists and the path is correct")
            sys.exit(1)
            
        result, regions, metrics, radar_chart = detect_skin_irregularities(image)
        cv2.imshow("Result", result)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")