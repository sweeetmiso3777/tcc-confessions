"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getItem, setItem } from "@/lib/indexedDB-utils";

export interface Confession {
  id: string;
  title: string;
  body: string;
  created_at: string | null;
  upvotes: number;
  downvotes: number;
}

const CACHE_KEY = "confessions_cache";
const LIMIT_KEY = "confession_limit";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function useConfessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voteTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    (async () => {
      const cached = await getItem<Confession[]>(CACHE_KEY);
      if (cached && Array.isArray(cached)) setConfessions(cached);
      fetchConfessions();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const lastConfession = await getItem<{ lastConfessionTime: number }>(LIMIT_KEY);
      if (lastConfession) {
        console.log("found previous confession record");
      }
    })();
  }, []);


  useEffect(() => {
    if (confessions.length > 0) {
      setItem(CACHE_KEY, confessions);
    }
  }, [confessions]);

  const fetchConfessions = async () => {
    setLoading(true);
    let query = supabase.from("confessions").select("*");

    if (confessions.length > 0) {
      const latest = confessions[0].created_at;
      if (latest) query = query.gt("created_at", latest);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) setError(error.message);
    else if (data && data.length > 0)
      setConfessions((prev) => [...(data as Confession[]), ...prev]);

    setLoading(false);
  };


  const canPostNow = async () => {
    const record = await getItem<{ lastConfessionTime: number }>(LIMIT_KEY);
    if (!record) return true;

    const elapsed = Date.now() - record.lastConfessionTime;
    return elapsed >= ONE_DAY_MS;
  };

  const submitConfession = async (title: string, body: string) => {
    const allowed = await canPostNow();
    if (!allowed) {
      setError("sorry part kas a lang kada adlaw");
      return null;
    }

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
      await setItem(CACHE_KEY, [newConfession, ...confessions]);
      await setItem(LIMIT_KEY, { lastConfessionTime: Date.now() });
      return newConfession;
    }
  };

  const handleVote = (id: string, type: "upvotes" | "downvotes") => {
    setConfessions((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [type]: (c[type] ?? 0) + 1 } : c
      )
    );

    if (voteTimeouts.current[id]) clearTimeout(voteTimeouts.current[id]);

    voteTimeouts.current[id] = setTimeout(async () => {
      const target = confessions.find((c) => c.id === id);
      if (!target) return;

      const { data, error } = await supabase
        .from("confessions")
        .update({ [type]: (target[type] ?? 0) + 1 })
        .eq("id", id)
        .select();

      if (error) setError(error.message);
      else if (data)
        setConfessions((prev) =>
          prev.map((c) => (c.id === id ? (data[0] as Confession) : c))
        );
    }, 200);
  };

  return {
    confessions,
    loading,
    error,
    submitConfession,
    upvoteConfession: (id: string) => handleVote(id, "upvotes"),
    downvoteConfession: (id: string) => handleVote(id, "downvotes"),
    refresh: fetchConfessions,
  };
}
