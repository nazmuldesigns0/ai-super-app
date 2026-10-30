"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { FileUploadButton, AttachmentPreviewList, filesToAttachments } from "@/components/chat/FileUploadButton";
import { MessageItem } from "@/components/chat/MessageItem";
import { AiProgressIndicator } from "@/components/chat/AiProgressIndicator";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ApiKeysModal, getSavedApiKeys } from "@/components/chat/ApiKeysModal";
import { Send, ArrowDown, Sparkles, MessageSquare, History, PanelLeftClose, PanelLeftOpen, Key, Paperclip, AlertCircle } from "lucide-react";
import type { Message, Attachment, ChatSession } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useModels } from "@/hooks/useModels";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import { authFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** True only when the drag payload actually contains files (ignores text/selection drags). */
function isFileDrag(e: React.DragEvent): boolean {
  const types = e.dataTransfer?.types;
  return !!types && Array.from(types).includes("Files");
}

export default function ChatPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Model & Arena State (Default: Auto Smart Router)
  const [model, setModel] = useState<string>("auto-router");
  const [modelB, setModelB] = useState<string>("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  const [isArenaMode, setIsArenaMode] = useState<boolean>(false);

  // Admin-managed model catalogue (falls back to the built-in list).
  const models = useModels();

  // Chat Data State
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [keysModalOpen, setKeysModalOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragDepthRef = useRef<number>(0);

  // Drag & drop file handling onto the chat workspace
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isProcessing) return;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    setDropError(null);
    const { attachments: newAttachments, error } = await filesToAttachments(files);
    if (error) setDropError(error);
    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
      textareaRef.current?.focus();
    }
  };

  // Load chat sessions for current user
  useEffect(() => {
    // Check if coming from Master Prompts runner
    if (typeof window !== "undefined") {
      const initialPrompt = sessionStorage.getItem("ai_super_initial_prompt");
      if (initialPrompt) {
        setInput(initialPrompt);
        sessionStorage.removeItem("ai_super_initial_prompt");
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    }

    async function loadSessions() {

      if (!user) return;
      try {
        setHistoryLoading(true);
        const res = await authFetch(`/api/chat/sessions?userId=${encodeURIComponent(user.uid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sessions) {
            setSessions(data.sessions);
          }
        }
      } catch (err) {
        console.warn("Could not load sessions from API:", err);
      } finally {
        setHistoryLoading(false);
      }
    }
    loadSessions();
  }, [user]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Load a specific session's messages
  const handleSelectSession = async (targetSessionId: string) => {
    if (isProcessing) return;
    try {
      setHistoryLoading(true);
      setSessionId(targetSessionId);
      const res = await authFetch(`/api/chat/sessions?sessionId=${encodeURIComponent(targetSessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Start new clean chat
  const handleNewChat = () => {
    if (isProcessing) return;
    setSessionId(uuidv4());
    setMessages([]);
    setInput("");
    setAttachments([]);
  };

  // Delete chat session
  const handleDeleteSession = async (targetSessionId: string) => {
    try {
      await authFetch(
        `/api/chat/sessions?sessionId=${encodeURIComponent(targetSessionId)}&userId=${encodeURIComponent(user?.uid || "")}`,
        { method: "DELETE" }
      );
      setSessions((prev) => prev.filter((s) => s.id !== targetSessionId));
      if (sessionId === targetSessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Handle Send
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && attachments.length === 0) || isProcessing) return;

    // Check credits client-side (admins / unlimited accounts are exempt)
    const currentCredits = profile?.creditBalance ?? 100;
    const modelAConfig = models.find((m) => m.id === model) || models[0];
    const modelBConfig = models.find((m) => m.id === modelB) || models[models.length - 1];
    const totalCost = isArenaMode ? modelAConfig.cost + modelBConfig.cost : modelAConfig.cost;

    if (currentCredits !== UNLIMITED_CREDITS && currentCredits < totalCost) {
      alert(`Insufficient credits! You need ${totalCost} credits, but currently have ${currentCredits}.`);
      return;
    }

    const currentAttachments = [...attachments];
    const userMsgId = uuidv4();
    const newUserMsg: Message = {
      id: userMsgId,
      sessionId,
      role: "user",
      content: trimmedInput,
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setAttachments([]);
    setIsProcessing(true);

    try {
      // Format history for context window
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          model,
          sessionId,
          userId: user?.uid,
          history: historyPayload,
          attachments: currentAttachments,
          isArenaMode,
          modelB,
          customApiKeys: getSavedApiKeys(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI response");
      }

      const assistantMsg: Message = {
        id: uuidv4(),
        sessionId: data.sessionId || sessionId,
        role: "assistant",
        content: data.content,
        model: data.model,
        tokensUsed: data.tokensUsed,
        comparison: data.comparison,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Update sessions list locally if new session
      setSessions((prev) => {
        const title = trimmedInput.slice(0, 40) + (trimmedInput.length > 40 ? "..." : "");
        const exists = prev.find((s) => s.id === sessionId);
        if (exists) {
          return prev.map((s) =>
            s.id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
          );
        }
        return [
          {
            id: sessionId,
            userId: user?.uid || "anon",
            title: title || "New Conversation",
            model,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });

      // Refresh credits balance in header
      if (refreshProfile) {
        refreshProfile();
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: uuidv4(),
        sessionId,
        role: "assistant",
        content: `⚠️ **Error**: ${err.message || "Failed to generate response. Check your API key and connection."}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Arena Voting Callback
  const handleVoteArena = (
    messageId: string,
    winner: "modelA" | "modelB" | "tie" | "both_bad"
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.comparison
          ? {
              ...m,
              comparison: {
                ...m.comparison,
                winner,
              },
            }
          : m
      )
    );
  };

  return (
    <div className="relative flex h-[calc(100vh-5.5rem)] w-full overflow-hidden rounded-2xl border border-border bg-background shadow-md">
      {/* Left Chat History Sidebar */}
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out md:static absolute inset-y-0 left-0 z-30",
          sidebarOpen ? "w-64" : "w-0 -translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        <div className="h-full w-64 overflow-hidden">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            isLoading={historyLoading}
          />
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div
        className="relative flex flex-1 flex-col overflow-hidden bg-background/50"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & drop overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/60 bg-primary/10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-background/90 px-6 py-5 text-center shadow-lg">
              <Paperclip className="h-6 w-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">Drop files to attach</p>
              <p className="text-xs text-muted-foreground">Images, PDFs, docs up to 10MB each</p>
            </div>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4 bg-card/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title={sidebarOpen ? "Collapse History" : "Open History"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
            <ModelSelector
              selectedModel={model}
              onSelectModel={setModel}
              isArenaMode={isArenaMode}
              onToggleArenaMode={setIsArenaMode}
              modelB={modelB}
              onSelectModelB={setModelB}
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKeysModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-sm"
              title="Manage AI Model API Keys & Firebase Status"
            >
              <Key className="h-3 w-3" />
              <span>API Keys</span>
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  AI Super Workspace
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Chat with Google Gemini models, upload PDFs or images (up to 10MB), or switch to Arena Mode for side-by-side LLM battles.
                </p>
              </div>

              {/* Quick Starter Prompts */}
              <div className="grid w-full max-w-lg grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {[
                  "Summarize key trends in generative AI",
                  "Analyze an uploaded PDF document",
                  "Compare Gemini 3.8 Flash vs Gemini 3.1 Pro",
                  "Generate a Python data analysis script",
                ].map((quickPrompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(quickPrompt);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border border-border/80 bg-card p-3 text-left text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-accent/50 hover:text-foreground"
                  >
                    "{quickPrompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onVoteArena={handleVoteArena}
              />
            ))
          )}

          {/* AI Processing Animation & Step Progress */}
          {isProcessing && (
            <div className="flex items-start gap-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <AiProgressIndicator
                hasAttachments={attachments.length > 0}
                modelName={
                  isArenaMode
                    ? `${model} vs ${modelB}`
                    : models.find((m) => m.id === model)?.displayName || "Gemini 3.8 Flash"
                }
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Box */}
        <div className="p-3 sm:p-4 bg-card/80 border-t border-border/80 backdrop-blur-md">
          {dropError && (
            <div className="mx-auto mb-2 flex max-w-4xl items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{dropError}</div>
              <button
                type="button"
                onClick={() => setDropError(null)}
                className="text-destructive/70 hover:text-destructive"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          )}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-border/90 bg-background shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            {/* Attachment preview tags */}
            <AttachmentPreviewList
              attachments={attachments}
              onRemove={(idx) =>
                setAttachments((prev) => prev.filter((_, i) => i !== idx))
              }
            />

            <div className="flex items-end gap-2 p-2.5">
              {/* 10MB File Attachment Picker */}
              <FileUploadButton
                attachments={attachments}
                onAddAttachments={(newFiles) =>
                  setAttachments((prev) => [...prev, ...newFiles])
                }
                onRemoveAttachment={(idx) =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                disabled={isProcessing}
              />

              {/* Message Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isProcessing}
                placeholder="Ask anything, analyze PDFs, or upload photos (up to 10MB)..."
                rows={1}
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 px-1 text-xs sm:text-sm outline-none placeholder:text-muted-foreground/60"
              />

              {/* Send Button */}
              <button
                type="button"
                disabled={isProcessing || (!input.trim() && attachments.length === 0)}
                onClick={handleSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                title="Send prompt (Enter)"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Gemini 3.8 Flash multimodal reasoning • Max 10MB upload • 1 credit / request
          </div>
        </div>
      </div>

      {/* API Keys & Providers Settings Modal */}
      <ApiKeysModal
        isOpen={keysModalOpen}
        onClose={() => setKeysModalOpen(false)}
      />
    </div>
  );
}
