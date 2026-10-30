"use client";

import React, { useRef, useState } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import type { Attachment } from "@/types";
import { formatBytes } from "@/lib/utils";

// Max 10MB limit in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FileUploadProps {
  attachments: Attachment[];
  onAddAttachments: (newAttachments: Attachment[]) => void;
  onRemoveAttachment: (index: number) => void;
  disabled?: boolean;
}

export function FileUploadButton({
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newAttachments: Attachment[] = [];
    const oversizedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Strict 10MB Validation
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(`${file.name} (${formatBytes(file.size)})`);
        continue;
      }

      // Convert to base64 for instant preview and prompt transmission
      try {
        const base64Data = await readFileAsDataUrl(file);
        newAttachments.push({
          url: base64Data,
          data: base64Data,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        });
      } catch (err) {
        console.error("Failed to read file", file.name, err);
      }
    }

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `The following file(s) exceed the 10MB limit: ${oversizedFiles.join(", ")}. Please select smaller files.`
      );
    }

    if (newAttachments.length > 0) {
      onAddAttachments(newAttachments);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,application/json"
        className="hidden"
        id="chat-file-picker"
        disabled={disabled}
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:border-primary/50 hover:bg-accent hover:text-foreground disabled:opacity-50"
        title="Attach files (PDF, Images, Docs up to 10MB)"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {/* Error modal/banner if oversized file */}
      {errorMessage && (
        <div className="absolute bottom-full left-0 mb-3 w-full max-w-lg rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive shadow-lg backdrop-blur-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Preview chips shown above input composer before sending
 */
export function AttachmentPreviewList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove: (index: number) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2.5 pb-0">
      {attachments.map((file, idx) => {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type.includes("pdf");

        return (
          <div
            key={idx}
            className="group relative flex items-center gap-2 rounded-xl border border-border bg-card/80 px-2.5 py-1.5 text-xs shadow-sm backdrop-blur"
          >
            {isImage && file.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={file.name}
                className="h-8 w-8 rounded-lg object-cover border border-border"
              />
            ) : isPdf ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-bold text-[10px]">
                PDF
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
            )}

            <div className="max-w-[130px] sm:max-w-[180px]">
              <p className="truncate font-medium text-foreground">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
