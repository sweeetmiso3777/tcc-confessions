"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConfessionsContext } from "@/providers/confessions-provider";
import { getItem, setItem } from "@/lib/indexedDB-utils";

const COOLDOWN_MS = 17 * 60 * 1000; // 17 minutes
const MAX_WORDS = 300;

export default function ConfessionForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { submitConfession, loading } = useConfessionsContext();
  const [cooldown, setCooldown] = useState<number>(0);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  useEffect(() => {
    (async () => {
      const lastSubmit = await getItem<number>("lastConfessionTime");
      const lastDate = await getItem<string>("lastConfessionDate");

      if (lastSubmit) {
        const elapsed = Date.now() - lastSubmit;
        if (elapsed < COOLDOWN_MS) setCooldown(COOLDOWN_MS - elapsed);
      }

      if (lastDate) {
        const today = new Date().toDateString();
        if (today === lastDate) setHasSubmittedToday(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 1000 ? c - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sanitizeInput = (text: string) => text.replace(/<[^>]*>?/gm, "").trim();

  const handleSubmit = async () => {
    const cleanTitle = sanitizeInput(title);
    const cleanBody = sanitizeInput(body);
    const wordCount = cleanBody.split(/\s+/).filter(Boolean).length;

    if (!cleanTitle || !cleanBody) {
      toast.error("😺", { description: "Don’t leave your secrets empty 💖" });
      return;
    }

    if (wordCount > MAX_WORDS) {
      toast.error("Too long!", {
        description: `Keep it under ${MAX_WORDS} words.`,
      });
      return;
    }

    if (hasSubmittedToday) {
      toast.error("Only once per day!", {
        description: "You’ve already confessed today 💬. Come back tomorrow 💖",
      });
      return;
    }

    if (cooldown > 0) {
      toast.error("Slow down!", {
        description: `Wait ${Math.ceil(
          cooldown / 60000
        )} minutes before another confession.`,
      });
      return;
    }

    const result = await submitConfession(cleanTitle, cleanBody);
    if (result) {
      const now = Date.now();
      const today = new Date().toDateString();

      await setItem("lastConfessionTime", now);
      await setItem("lastConfessionDate", today);

      setCooldown(COOLDOWN_MS);
      setHasSubmittedToday(true);
      setTitle("");
      setBody("");
      toast.success("submitted!", { description: "yay!!!" });
      onClose();
    }
  };

  return (
    <div className="max-w-md w-full p-6 bg-primary border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-white">
      <h2 className="text-2xl font-bold mb-4 bg-foreground rounded-md p-2 text-white">
        New Confession
      </h2>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        className="w-full p-2 mb-4 bg-foreground rounded-md border border-black text-white placeholder-gray-300"
      />

      <textarea
        placeholder="Body (max 300 words)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full p-2 mb-4 bg-foreground rounded-md border border-black h-32 text-white placeholder-gray-300"
      />

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-foreground border-2 border-black rounded-md shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-white"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-foreground border-2 border-black rounded-md shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-white disabled:opacity-60"
          disabled={loading || cooldown > 0 || hasSubmittedToday}
        >
          {hasSubmittedToday
            ? "Come back tomorrow"
            : cooldown > 0
            ? `Wait ${Math.ceil(cooldown / 60000)}m`
            : loading
            ? "Submitting..."
            : "Submit"}
        </button>
      </div>
    </div>
  );
}
