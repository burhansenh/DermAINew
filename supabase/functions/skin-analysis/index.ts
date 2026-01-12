import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://yce-api-01.makeupar.com";

interface FileUploadResponse {
  status: number;
  data: {
    files: Array<{
      file_id: string;
      requests: Array<{
        method: string;
        url: string;
        headers: Record<string, string>;
      }>;
    }>;
  };
}

interface TaskResponse {
  status: number;
  data: {
    task_id?: string;
    task_status?: string;
    results?: {
      output?: Array<{
        type: string;
        ui_score: number;
        raw_score: number;
        mask_urls?: string[];
      }>;
    };
    error?: string;
    error_code?: string;
  };
  error?: string;
  error_code?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERFECTCORP_API_KEY = Deno.env.get("PERFECTCORP_API_KEY");

    console.log("API Key loaded:", PERFECTCORP_API_KEY ? `Yes (${PERFECTCORP_API_KEY.substring(0, 10)}...)` : "No");

    if (!PERFECTCORP_API_KEY) {
      throw new Error("PERFECTCORP_API_KEY is not configured");
    }

    const { action, imageBase64, contentType, fileSize, taskId } = await req.json();

    if (action === "upload") {
      // Step 1: Get upload URL
      const fileName = `skin_analysis_${Date.now()}.${contentType.split("/")[1]}`;

      const fileResponse = await fetch(`${API_BASE}/s2s/v2.0/file/skin-analysis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PERFECTCORP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [{
            content_type: contentType,
            file_name: fileName,
            file_size: fileSize,
          }],
        }),
      });

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error("File API error:", errorText);
        throw new Error(`File API error: ${fileResponse.status}`);
      }

      const fileData: FileUploadResponse = await fileResponse.json();

      if (fileData.status !== 200 || !fileData.data.files?.[0]) {
        throw new Error("Failed to get upload URL");
      }

      const fileInfo = fileData.data.files[0];
      const uploadRequest = fileInfo.requests[0];

      // Step 2: Upload the image to S3
      const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

      const uploadResponse = await fetch(uploadRequest.url, {
        method: uploadRequest.method,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileSize.toString(),
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Step 3: Create skin analysis task with SD concerns
      const taskResponse = await fetch(`${API_BASE}/s2s/v2.0/task/skin-analysis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PERFECTCORP_API_KEY}`,
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
        throw new Error(`Task API error: ${taskResponse.status}`);
      }

      const taskData: TaskResponse = await taskResponse.json();

      if (taskData.status !== 200 || !taskData.data.task_id) {
        throw new Error(taskData.error || "Failed to create analysis task");
      }

      return new Response(JSON.stringify({
        success: true,
        taskId: taskData.data.task_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "poll") {
      if (!taskId) {
        throw new Error("taskId is required for polling");
      }

      const statusResponse = await fetch(
        `${API_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${PERFECTCORP_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Poll API error:", errorText);
        throw new Error(`Poll API error: ${statusResponse.status}`);
      }

      const statusData: TaskResponse = await statusResponse.json();
      console.log("Raw API response:", JSON.stringify(statusData, null, 2));
      console.log("Task status:", statusData.data?.task_status);
      console.log("Has results:", !!statusData.data?.results);
      console.log("Has error:", !!statusData.data?.error || !!statusData.error);

      // Return full response including any error info
      return new Response(JSON.stringify({
        success: true,
        status: statusData.data.task_status,
        results: statusData.data.results,
        error: statusData.data.error || statusData.error,
        error_code: statusData.data.error_code || statusData.error_code,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Skin analysis error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
