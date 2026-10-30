"use client";

import { useState } from "react";

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    alert("Connect this to a Cloud Function that sends emails to all users in the `users` collection.");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Email Broadcast</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleSend}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Send to all users
        </button>
      </div>
    </div>
  );
}
