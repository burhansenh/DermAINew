import { useCallback, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelect(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="relative animate-scale-in">
        <div className="relative overflow-hidden rounded-lg border border-border bg-secondary">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-[400px] object-contain"
          />
          {!isLoading && (
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Analyzing your skin...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
          ${isDragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-muted-foreground"
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-secondary">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">
              Drop your photo here
            </p>
            <p className="text-sm text-muted-foreground">
              or use the buttons below
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
        <Button
          variant="default"
          className="flex-1 h-12 bg-accent hover:bg-sage-dark text-accent-foreground"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm font-medium mb-2">📸 Photo Requirements:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ Face looking <strong>directly at camera</strong> (not tilted or turned)</li>
          <li>✓ Well-lit environment (avoid shadows on face)</li>
          <li>✓ Only one person in the photo</li>
          <li>✓ Face clearly visible (remove glasses/masks if possible)</li>
          <li>✓ Close-up or medium distance (face should be prominent)</li>
        </ul>
      </div>
    </div>
  );
}
