"use client";

import { useEffect, useState } from "react";
import { SUPPORTED_MODELS, type ModelDefinition } from "@/lib/models";

/**
 * The AI models currently enabled by the admin.
 *
 * Falls back to the built-in catalogue while loading (or if the request
 * fails), so the picker never renders empty.
 */
export function useModels(): ModelDefinition[] {
  const [models, setModels] = useState<ModelDefinition[]>(SUPPORTED_MODELS);

  useEffect(() => {
    let active = true;

    fetch("/api/models")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.models) && data.models.length > 0) {
          setModels(data.models as ModelDefinition[]);
        }
      })
      .catch(() => {
        /* keep the built-in fallback */
      });

    return () => {
      active = false;
    };
  }, []);

  return models;
}
