"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getPresignedUploadUrl, deleteUploadedImage } from "@/app/actions/upload";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url, publicUrl } = await getPresignedUploadUrl(file.type, file.size);
      const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("Upload mislukt");
      onChange(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!value) return;
    try {
      await deleteUploadedImage(value);
    } catch {
      // best-effort delete — don't block the user
    }
    onChange(null);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  if (value) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-100">
        <Image src={value} alt="Recept foto" fill className="object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-3 right-3 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-stone-700 hover:bg-white transition-colors shadow"
        >
          Verwijderen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-amber-500 bg-amber-50"
            : "border-stone-200 hover:border-stone-300 bg-stone-50"
        }`}
      >
        {uploading ? (
          <p className="text-sm text-stone-400">Uploaden…</p>
        ) : (
          <>
            <p className="text-sm font-medium text-stone-500">
              Foto toevoegen
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Sleep een foto hiernaartoe, of tik om te kiezen of te fotograferen
            </p>
          </>
        )}
      </div>

      {/* accept="image/*" without capture gives camera + library choice on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
