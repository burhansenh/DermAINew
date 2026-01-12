import { useState, useCallback } from "react";
import { toast } from "sonner";

const API_BASE = "https://yce-api-01.makeupar.com";
const API_KEY = import.meta.env.VITE_PERFECTCORP_API_KEY;

interface SkinConcern {
  type: string;
  ui_score: number;
  raw_score: number;
  mask_urls?: string[];
}

interface AnalysisState {
  isLoading: boolean;
  results: SkinConcern[] | null;
  imageUrl: string | null;
  error: string | null;
}

export function useSkinAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    results: null,
    imageUrl: null,
    error: null,
  });

  const analyzeImage = useCallback(async (file: File) => {
    // Create image URL for display
    const imageUrl = URL.createObjectURL(file);
    setState({ isLoading: true, results: null, imageUrl, error: null });

    try {
      if (!API_KEY) {
        throw new Error("API key not configured. Please check your .env file.");
      }

      console.log("API Key loaded:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "NOT FOUND");

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Step 1: Get upload URL
      const fileName = `skin_analysis_${Date.now()}.${file.type.split("/")[1]}`;

      console.log("Step 1: Requesting upload URL...");
      const fileResponse = await fetch(`${API_BASE}/s2s/v2.0/file/skin-analysis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [{
            content_type: file.type,
            file_name: fileName,
            file_size: file.size,
          }],
        }),
      });

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error("File API error:", errorText);
        throw new Error(`Failed to get upload URL: ${fileResponse.status}`);
      }

      const fileData = await fileResponse.json();
      console.log("Upload URL response:", fileData);

      if (fileData.status !== 200 || !fileData.data.files?.[0]) {
        throw new Error("Failed to get upload URL");
      }

      const fileInfo = fileData.data.files[0];
      const uploadRequest = fileInfo.requests[0];

      // Step 2: Upload the image to S3
      console.log("Step 2: Uploading image...");
      const imageBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      const uploadResponse = await fetch(uploadRequest.url, {
        method: uploadRequest.method,
        headers: {
          "Content-Type": file.type,
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log("Image uploaded successfully");

      // Step 3: Create skin analysis task
      console.log("Step 3: Creating analysis task...");
      const taskResponse = await fetch(`${API_BASE}/s2s/v2.0/task/skin-analysis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          src_file_id: fileInfo.file_id,
          dst_actions: [
            "wrinkle",
            "pore",
            "texture",
            "acne",
            "moisture",
            "oiliness",
            "redness",
            "dark_circle_v2",
            "firmness",
            "radiance",
            "age_spot"
          ],
          miniserver_args: {
            enable_mask_overlay: true,
          },
          format: "json",
        }),
      });

      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        console.error("Task API error:", errorText);
        throw new Error(`Failed to create task: ${taskResponse.status}`);
      }

      const taskData = await taskResponse.json();
      console.log("Task created:", taskData);

      if (taskData.status !== 200 || !taskData.data.task_id) {
        throw new Error(taskData.error || "Failed to create analysis task");
      }

      const taskId = taskData.data.task_id;

      // Step 4: Poll for results
      console.log("Step 4: Polling for results...");
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(
          `${API_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error("Poll API error:", errorText);
          throw new Error(`Poll failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        console.log(`Poll attempt ${attempts + 1}:`, statusData.data?.task_status);

        if (statusData.data?.task_status === "success" && statusData.data?.results?.output) {
          console.log("Analysis complete!", statusData.data.results.output);
          setState(prev => ({
            isLoading: false,
            results: statusData.data.results.output,
            imageUrl: prev.imageUrl,
            error: null,
          }));
          toast.success("Analysis complete!");
          return;
        }

        if (statusData.data?.task_status === "error") {
          const errorCode = statusData.data?.error_code || statusData.error_code || "";
          const errorMsg = statusData.data?.error || statusData.error || "Analysis failed";

          console.error("API error:", errorMsg, "Code:", errorCode);

          // Provide user-friendly error messages based on error code
          let userMessage = "";
          if (errorCode.includes("face_angle") || errorCode.includes("large_face_angle")) {
            userMessage = "Please use a photo with your face looking directly at the camera (not tilted or turned to the side).";
          } else if (errorCode.includes("no_face") || errorCode.includes("face_not_found")) {
            userMessage = "No face detected. Please use a clear photo showing your face.";
          } else if (errorCode.includes("multiple_face")) {
            userMessage = "Multiple faces detected. Please use a photo with only one person.";
          } else if (errorCode.includes("small_face")) {
            userMessage = "Face is too small. Please use a closer photo or crop the image.";
          } else if (errorCode.includes("blur")) {
            userMessage = "Image is too blurry. Please use a clearer, sharper photo.";
          } else if (errorCode.includes("dark") || errorCode.includes("lighting")) {
            userMessage = "Image is too dark. Please use a well-lit photo.";
          } else {
            userMessage = `Analysis error: ${errorMsg}. Please try a different photo.`;
          }

          throw new Error(userMessage);
        }

        attempts++;
      }

      throw new Error("Analysis timed out. Please try again.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Analysis error:", error);
      setState(prev => ({
        isLoading: false,
        results: null,
        imageUrl: prev.imageUrl,
        error: message,
      }));
      toast.error(message);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      results: null,
      imageUrl: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeImage,
    reset,
  };
}
