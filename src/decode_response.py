import json
import base64
import os

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up one level to the project root
project_root = os.path.dirname(current_dir)
# Construct paths using os.path.join
response_path = os.path.join(project_root, 'response', 'response.json')
output_path = os.path.join(project_root, 'response', 'processed_image.jpg')

# Read the JSON response
with open(response_path, 'r') as f:
    response_data = json.load(f)

# Get the base64 image string
img_data = response_data['processed_image']

# Decode the base64 string
img_bytes = base64.b64decode(img_data)

# Save the decoded image
with open(output_path, 'wb') as f:
    f.write(img_bytes)

print(f"Processed image saved to: {output_path}")