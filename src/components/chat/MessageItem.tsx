"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  FileText,
  Sparkles,
  User as UserIcon,
  Download,
  ThumbsUp,
  Award,
  Equal,
  ThumbsDown,
  ExternalLink,
} from "lucide-react";
import type { Message, Attachment } from "@/types";
import { formatBytes, cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  onVoteArena?: (messageId: string, winner: "modelA" | "modelB" | "tie" | "both_bad") => void;
}

export function MessageItem({ message, onVoteArena }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isUser = message.role === "user";
  const isErrorMessage = !isUser && (message.content.startsWith("⚠️ **Error**") || message.content.includes("Error:"));

  const handleCopy = (text: string, isModelB = false) => {
    navigator.clipboard.writeText(text);
    if (isModelB) {
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-4 transition-all",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[92%] sm:max-w-[85%] flex-col gap-2",
          isUser && "items-end"
        )}
      >
        {/* Attachment Previews in Chat Bubble */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {message.attachments.map((att, i) => (
              <AttachmentDisplay
                key={i}
                attachment={att}
                onPreview={(url) => setPreviewImage(url)}
              />
            ))}
          </div>
        )}

        {/* Standard User or Single Assistant Bubble */}
        {!message.comparison ? (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : isErrorMessage
                ? "bg-amber-500/5 border border-amber-500/40 text-foreground rounded-bl-sm"
                : "bg-card border border-border text-foreground rounded-bl-sm"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {!isUser && (
              <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground/80">
                    {message.model || "Gemini 3.8 Flash"}
                  </span>
                  {message.tokensUsed ? (
                    <span>• {message.tokensUsed} tokens</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(message.content)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Arena Mode Side-by-Side Comparison */
          <div className="w-full space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Award className="h-3.5 w-3.5" />
              <span>Arena Comparison Battle: Compare outputs below and vote!</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Model A Card */}
              <div
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all",
                  message.comparison.winner === "modelA"
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
                    : "border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                    <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold">
                        Model A
                      </span>
                      {message.model || "Gemini 3.8 Flash"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy response"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onVoteArena?.(message.id, "modelA")}
                  className={cn(
                    "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all",
                    message.comparison.winner === "modelA"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "border-border hover:bg-accent text-foreground"
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>
                    {message.comparison.winner === "modelA"
                      ? "Selected as Winner! 🏆"
                      : "Model A is Better"}
                  </span>
                </button>
              </div>

              {/* Model B Card */}
              <div
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all",
                  message.comparison.winner === "modelB"
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
                    : "border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                    <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-bold">
                        Model B
                      </span>
                      {message.comparison.modelB || "Gemini 3.1 Pro"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.comparison?.contentB || "", true)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy response"
                    >
                      {copiedB ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.comparison.contentB}
                    </ReactMarkdown>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onVoteArena?.(message.id, "modelB")}
                  className={cn(
                    "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all",
                    message.comparison.winner === "modelB"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "border-border hover:bg-accent text-foreground"
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>
                    {message.comparison.winner === "modelB"
                      ? "Selected as Winner! 🏆"
                      : "Model B is Better"}
                  </span>
                </button>
              </div>
            </div>

            {/* Tie / Both Bad actions */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onVoteArena?.(message.id, "tie")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  message.comparison.winner === "tie" &&
                    "bg-accent text-foreground font-semibold border-primary/50"
                )}
              >
                <Equal className="h-3 w-3" />
                <span>It's a Tie</span>
              </button>
              <button
                type="button"
                onClick={() => onVoteArena?.(message.id, "both_bad")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  message.comparison.winner === "both_bad" &&
                    "bg-destructive/10 text-destructive border-destructive/40"
                )}
              >
                <ThumbsDown className="h-3 w-3" />
                <span>Both are Bad</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm">
          <UserIcon className="h-4 w-4" />
        </div>
      )}

      {/* Lightbox image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-card border border-border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Attachment preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentDisplay({
  attachment,
  onPreview,
}: {
  attachment: Attachment;
  onPreview: (url: string) => void;
}) {
  const isImage = attachment.type.startsWith("image/");
  const isPdf = attachment.type.includes("pdf");

  if (isImage && (attachment.url || attachment.data)) {
    const src = attachment.url || attachment.data || "";
    return (
      <div
        onClick={() => onPreview(src)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border shadow-sm transition hover:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={attachment.name}
          className="h-28 w-28 object-cover sm:h-36 sm:w-36 transition-transform group-hover:scale-105 duration-200"
        />
        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white truncate text-center">
          {attachment.name}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/90 px-3 py-2 text-xs shadow-sm">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-[10px]",
          isPdf ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
        )}
      >
        {isPdf ? "PDF" : <FileText className="h-4 w-4" />}
      </div>
      <div className="max-w-[150px] sm:max-w-[200px]">
        <p className="truncate font-medium text-foreground">{attachment.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatBytes(attachment.size)}
        </p>
      </div>
      {attachment.url && (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Open file"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
