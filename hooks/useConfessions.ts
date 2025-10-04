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
const VOTE_KEY = "confession_votes";
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000; 

export function useConfessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voteTimeouts = useRef<Record<string, NodeJS.Timeout>>({});


  useEffect(() => {
    (async () => {
      const cached = await getItem<Confession[]>(CACHE_KEY);
      if (cached && Array.isArray(cached)) {
        setConfessions(cached);
        console.log("loaded cached confessions from indexeddb");
      }
      fetchConfessions();
    })();
  }, []);


  useEffect(() => {
    (async () => {
      const lastConfession = await getItem<{ lastConfessionTime: number }>(LIMIT_KEY);
      if (lastConfession) console.log("🕒 Previous confession found in IndexedDB");
    })();
  }, []);

 
  useEffect(() => {
    if (confessions.length > 0) setItem(CACHE_KEY, confessions);
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

  // 8 hour checkerererer
  const canPostNow = async () => {
    const record = await getItem<{ lastConfessionTime: number }>(LIMIT_KEY);
    if (!record) return true;

    const elapsed = Date.now() - record.lastConfessionTime;
    return elapsed >= EIGHT_HOURS_MS;
  };

  // --- Submit a confession (with cooldown check) ---
  const submitConfession = async (title: string, body: string) => {
    const allowed = await canPostNow();
    if (!allowed) {
      setError("you can only confess once every 8 hours :3");
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
      console.log("confession submitted and cooldown saved");
      return newConfession;
    }
  };

  //handle upvote/downvote 
  const handleVote = async (id: string, type: "upvotes" | "downvotes") => {
    const votes = (await getItem<Record<string, "up" | "down">>(VOTE_KEY)) || {};
    const previousVote = votes[id];

    if (previousVote === "up" && type === "upvotes") return;
    if (previousVote === "down" && type === "downvotes") return;

    setConfessions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let up = c.upvotes ?? 0;
        let down = c.downvotes ?? 0;

       
        if (previousVote === "up") up -= 1;
        else if (previousVote === "down") down -= 1;

     
        if (type === "upvotes") up += 1;
        else down += 1;

        return { ...c, upvotes: up, downvotes: down };
      })
    );

   
    votes[id] = type === "upvotes" ? "up" : "down";
    await setItem(VOTE_KEY, votes);

    
    if (voteTimeouts.current[id]) clearTimeout(voteTimeouts.current[id]);
    voteTimeouts.current[id] = setTimeout(async () => {
      const target = confessions.find((c) => c.id === id);
      if (!target) return;

      const { data, error } = await supabase
        .from("confessions")
        .update({ upvotes: target.upvotes, downvotes: target.downvotes })
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
