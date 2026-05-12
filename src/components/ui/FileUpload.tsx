"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange: (data: { file: File; base64: string; name: string; mimeType: string } | null) => void;
  error?: string;
  maxSizeMB?: number;
}

export function FileUpload({ label, accept = ".pdf,.jpg,.jpeg,.png", onChange, error, maxSizeMB = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`El archivo excede el límite de ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        setPreview(base64);
        setFileName(file.name);
        onChange({
          file,
          base64: base64Data,
          name: file.name,
          mimeType: file.type,
        });
        setUploading(false);
      };
      reader.onerror = () => {
        setUploading(false);
        alert("Error al leer el archivo");
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      alert("Error al procesar el archivo");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange(null);
  };

  const isImage = fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}

      {preview ? (
        <div className="relative p-4 border border-white/10 rounded-lg bg-slate-800/50">
          {isImage ? (
            <img src={preview} alt="Vista previa" className="max-h-40 rounded object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-slate-300">{fileName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="mt-3 flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar archivo
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-white/20 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Procesando...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16.6 7c-.21.91-.45 1.81-.73 2.68A4 4 0 0114 15.9z" />
                </svg>
                <span className="text-sm">Subir archivo (máx. {maxSizeMB}MB)</span>
              </>
            )}
          </button>
        </>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
