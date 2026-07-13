import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, UploadCloud } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  initialPreview?: string | null;
}

export function ImageUpload({ label, onChange, required, initialPreview }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);

  React.useEffect(() => {
    if (initialPreview) {
      setPreview(initialPreview);
    }
  }, [initialPreview]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden group bg-slate-50",
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-100 hover:border-slate-300"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />

        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> Change Image
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Drop your image here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-slate-400">Supports: JPG, JPEG, PNG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
}
