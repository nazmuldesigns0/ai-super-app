"use client";

import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, Search, Sparkles } from "lucide-react";
import type { ChatSession } from "@/types";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isLoading = false,
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = sessions.filter((s) =>
    (s.title || "Untitled Chat")
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card/50">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Filter */}
      {sessions.length > 5 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full rounded-lg border border-input bg-background/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Recent Conversations
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
            Loading history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {searchTerm ? "No matching chats" : "No conversations yet. Start a new chat!"}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2 min-w-0 pr-6">
                  <MessageSquare
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">
                    {session.title || "Untitled Conversation"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this conversation?")) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-destructive/10 hover:text-destructive transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
