"use client";

import { useEffect, useState } from "react";
import { PLANS, type Plan } from "@/lib/plans";

/**
 * Returns the admin-configurable plan catalogue. Falls back to the built-in
 * defaults while loading or if the request fails.
 */
export function usePlans(): Plan[] {
  const [plans, setPlans] = useState<Plan[]>(PLANS);

  useEffect(() => {
    let active = true;
    fetch("/api/plans")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {
        /* keep built-in defaults */
      });
    return () => {
      active = false;
    };
  }, []);

  return plans;
}
