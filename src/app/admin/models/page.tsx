"use client";

import { useState } from "react";

import { SUPPORTED_MODELS } from "@/lib/gemini";

const INITIAL_MODELS = SUPPORTED_MODELS.map((m) => ({
  id: m.id,
  name: `${m.displayName} (${m.provider})`,
  enabled: true,
  cost: m.cost,
}));

export default function AdminModelsPage() {
  const [models, setModels] = useState(INITIAL_MODELS);

  const toggle = (id: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
    // TODO: write to Firestore `aiModels/{id}`
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">AI Models Control</h1>
      <p className="text-muted-foreground mb-6">
        Toggle models on/off instantly. Disabled models disappear from the Arena selector.
      </p>

      <div className="space-y-3">
        {models.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">
                Cost: {m.cost} credit(s)
              </p>
            </div>
            <button
              onClick={() => toggle(m.id)}
              className={`relative h-6 w-11 rounded-full transition ${
                m.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                  m.enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
