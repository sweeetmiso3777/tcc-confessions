"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

interface Confession {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string | null;
  upvotes: number;
  downvotes: number;
}

interface ConfessionsContextType {
  confessions: Confession[];
  loading: boolean;
  upvoteConfession: (id: string) => void;
  downvoteConfession: (id: string) => void;
  submitConfession: (title: string, body: string) => Promise<Confession | null>;
}

const ConfessionsContext = createContext<ConfessionsContextType | undefined>(
  undefined
);

export function ConfessionsProvider({ children }: { children: ReactNode }) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch confessions from Supabase ---
  const fetchConfessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching confessions:", error.message);
    } else {
      setConfessions(data as Confession[]);
    }
    setLoading(false);
  };

  // --- Submit new confession ---
  const submitConfession = async (
    title: string,
    body: string
  ): Promise<Confession | null> => {
    const { data, error } = await supabase
      .from("confessions")
      .insert([{ title, body }])
      .select();

    if (error) {
      console.error("Error submitting confession:", error.message);
      return null;
    }

    const newConfession = data?.[0] as Confession;
    if (newConfession) {
      setConfessions((prev) => [newConfession, ...prev]);
    }
    return newConfession;
  };

  // --- Optimistic local upvote ---
  const upvoteConfession = (id: string) => {
    setConfessions((prev) =>
      prev.map((confession) =>
        confession.id === id
          ? { ...confession, upvotes: confession.upvotes + 1 }
          : confession
      )
    );
    // TODO: call supabase to persist votes
  };

  // --- Optimistic local downvote ---
  const downvoteConfession = (id: string) => {
    setConfessions((prev) =>
      prev.map((confession) =>
        confession.id === id
          ? { ...confession, downvotes: confession.downvotes + 1 }
          : confession
      )
    );
    // TODO: call supabase to persist votes
  };

  useEffect(() => {
    fetchConfessions();
  }, []);

  return (
    <ConfessionsContext.Provider
      value={{
        confessions,
        loading,
        upvoteConfession,
        downvoteConfession,
        submitConfession,
      }}
    >
      {children}
    </ConfessionsContext.Provider>
  );
}

export function useConfessionsContext() {
  const context = useContext(ConfessionsContext);
  if (context === undefined) {
    throw new Error(
      "useConfessionsContext must be used within a ConfessionsProvider"
    );
  }
  return context;
}
