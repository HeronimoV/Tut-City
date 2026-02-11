"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  onCapture: (imageData: string) => void;
}

export default function CameraCapture({ onCapture }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) onCapture(e.target.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Upload your problem 📸</h2>
        <p className="text-gray-500 text-sm mt-1">Take a photo or upload an image</p>
      </div>

      {/* Camera button — primary on mobile */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-full gradient-bg text-white font-bold text-lg py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
      >
        <span className="text-2xl">📷</span>
        Take a Photo
      </button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />

      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <div className="flex-1 h-px bg-gray-200" />
        or
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Drag & drop / file upload */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-violet-400 bg-violet-50"
            : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-3">📁</div>
        <p className="text-gray-600 font-medium">
          {dragActive ? "Drop it here!" : "Drag & drop or tap to upload"}
        </p>
        <p className="text-gray-400 text-xs mt-2">PNG, JPG up to 10MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
    </div>
  );
}
