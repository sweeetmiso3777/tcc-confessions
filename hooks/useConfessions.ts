"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Confession {
  id: string;
  title: string;
  body: string;
  created_at: string | null;
  upvotes: number;
  downvotes: number;
}

const CACHE_KEY = "confessions_cache";

export function useConfessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voteTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // --- Load cache on mount ---
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setConfessions(JSON.parse(cached));
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    fetchConfessions(); // always try to refresh
  }, []);

  // --- Save cache whenever confessions change ---
  useEffect(() => {
    if (confessions.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(confessions));
    }
  }, [confessions]);

  // --- Fetch only new confessions ---
  const fetchConfessions = async () => {
    setLoading(true);

    let query = supabase.from("confessions").select("*");

    if (confessions.length > 0) {
      const latest = confessions[0].created_at;
      if (latest) {
        query = query.gt("created_at", latest);
      }
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setConfessions((prev) => [...(data as Confession[]), ...prev]);
    }

    setLoading(false);
  };

  // --- Submit confession ---
  const submitConfession = async (title: string, body: string) => {
    const { data, error } = await supabase
      .from("confessions")
      .insert([{ title, body }])
      .select();

    if (error) {
      setError(error.message);
      return null;
    } else {
      const newConfession = data?.[0] as Confession;
      setConfessions((prev) => [newConfession, ...prev]);
      return newConfession;
    }
  };

  // --- Optimistic vote handler ---
  // --- Optimistic vote handler ---
const handleVote = (id: string, type: "upvotes" | "downvotes") => {
  // Optimistic update
  setConfessions((prev) =>
    prev.map((c) =>
      c.id === id ? { ...c, [type]: (c[type] ?? 0) + 1 } : c
    )
  );

  // Clear old debounce if spammed
  if (voteTimeouts.current[id]) {
    clearTimeout(voteTimeouts.current[id]);
  }

  // Debounced DB update
  voteTimeouts.current[id] = setTimeout(async () => {
    // fetch current value
    const target = confessions.find((c) => c.id === id);
    if (!target) return;

    const { data, error } = await supabase
      .from("confessions")
      .update({ [type]: (target[type] ?? 0) + 1 })
      .eq("id", id)
      .select();

    if (error) {
      setError(error.message);
    } else if (data) {
      setConfessions((prev) =>
        prev.map((c) => (c.id === id ? (data[0] as Confession) : c))
      );
    }
  }, 200);
};


  const upvoteConfession = (id: string) => handleVote(id, "upvotes");
  const downvoteConfession = (id: string) => handleVote(id, "downvotes");

  return {
    confessions,
    loading,
    error,
    submitConfession,
    upvoteConfession,
    downvoteConfession,
    refresh: fetchConfessions,
  };
}
