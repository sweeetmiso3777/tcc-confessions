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
    if (confessions.length > 0) setItem(CACHE_KEY, confessions);
  }, [confessions]);

  const fetchConfessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else if (data) setConfessions(data as Confession[]);

    setLoading(false);
  };

  const canPostNow = async () => {
    const record = await getItem<{ lastConfessionTime: number }>(LIMIT_KEY);
    if (!record) return true;

    const elapsed = Date.now() - record.lastConfessionTime;
    return elapsed >= EIGHT_HOURS_MS;
  };

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
      await setItem(LIMIT_KEY, { lastConfessionTime: Date.now() });
      return newConfession;
    }
  };

  const handleVote = async (id: string, type: "upvotes" | "downvotes") => {
    const votes = (await getItem<Record<string, "up" | "down">>(VOTE_KEY)) || {};
    const previousVote = votes[id];

    // If clicking the same vote again, remove the vote
    if ((previousVote === "up" && type === "upvotes") || 
        (previousVote === "down" && type === "downvotes")) {
      // Remove the vote
      delete votes[id];
      await setItem(VOTE_KEY, votes);
      
      // Optimistic update - revert the vote
      setConfessions(prev => prev.map(confession => 
        confession.id === id 
          ? { 
              ...confession, 
              upvotes: type === "upvotes" ? Math.max(0, confession.upvotes - 1) : confession.upvotes,
              downvotes: type === "downvotes" ? Math.max(0, confession.downvotes - 1) : confession.downvotes
            }
          : confession
      ));
      return;
    }

    if (voteTimeouts.current[id]) {
      clearTimeout(voteTimeouts.current[id]);
    }

    // Optimistic update
    setConfessions(prev => prev.map(confession => {
      if (confession.id !== id) return confession;

      let newUpvotes = confession.upvotes;
      let newDownvotes = confession.downvotes;

      // Remove previous vote if exists
      if (previousVote === "up") newUpvotes = Math.max(0, newUpvotes - 1);
      if (previousVote === "down") newDownvotes = Math.max(0, newDownvotes - 1);

      // Add new vote
      if (type === "upvotes") newUpvotes += 1;
      else newDownvotes += 1;

      return { ...confession, upvotes: newUpvotes, downvotes: newDownvotes };
    }));

    const newVote = type === "upvotes" ? "up" : "down";
    votes[id] = newVote;
    await setItem(VOTE_KEY, votes);

    voteTimeouts.current[id] = setTimeout(async () => {
      try {
        const currentConfession = confessions.find(c => c.id === id);
        if (!currentConfession) return;

        let upvotes = currentConfession.upvotes;
        let downvotes = currentConfession.downvotes;

        // Remove previous vote
        if (previousVote === "up") upvotes = Math.max(0, upvotes - 1);
        if (previousVote === "down") downvotes = Math.max(0, downvotes - 1);

        // Add new vote
        if (type === "upvotes") upvotes += 1;
        else downvotes += 1;

        // Update in Supabase
        const { error } = await supabase
          .from("confessions")
          .update({ upvotes, downvotes })
          .eq("id", id);

        if (error) {
          console.error("Failed to update vote:", error);
          // Revert optimistic update on error
          setConfessions(prev => prev.map(confession => 
            confession.id === id 
              ? { ...confession, upvotes: currentConfession.upvotes, downvotes: currentConfession.downvotes }
              : confession
          ));
          
          // Revert vote in storage
          if (previousVote) {
            votes[id] = previousVote;
          } else {
            delete votes[id];
          }
          await setItem(VOTE_KEY, votes);
        } else {
          // Refresh to ensure sync with server
          fetchConfessions();
        }
      } catch (err) {
        console.error("Vote error:", err);
      } finally {
        delete voteTimeouts.current[id];
      }
    }, 500);
  };

  const getUserVote = async (id: string): Promise<"up" | "down" | null> => {
    const votes = await getItem<Record<string, "up" | "down">>(VOTE_KEY);
    return votes?.[id] || null;
  };

  return {
    confessions,
    loading,
    error,
    submitConfession,
    upvoteConfession: (id: string) => handleVote(id, "upvotes"),
    downvoteConfession: (id: string) => handleVote(id, "downvotes"),
    getUserVote,
    refresh: fetchConfessions,
  };
}