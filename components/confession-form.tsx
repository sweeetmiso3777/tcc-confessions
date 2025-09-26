"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConfessionsContext } from "@/providers/confessions-provider";

const COOLDOWN_MS = 17 * 60 * 1000; // 17 minutes

export default function ConfessionForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { submitConfession, loading } = useConfessionsContext();

  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    const lastSubmit = localStorage.getItem("lastConfessionTime");
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      if (elapsed < COOLDOWN_MS) {
        setCooldown(COOLDOWN_MS - elapsed);
      }
    }
  }, []);

  // Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 1000 ? c - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("😺✨ Meow!", {
        description: "Don’t leave your secrets empty… Fill in both fields 💖🐾",
      });
      return;
    }

    if (cooldown > 0) {
      toast.error("⏳ Slow down!", {
        description: `Please wait ${Math.ceil(
          cooldown / 60000
        )} minutes before confessing again.`,
      });
      return;
    }

    const result = await submitConfession(title, body);
    if (result) {
      localStorage.setItem("lastConfessionTime", Date.now().toString());
      setCooldown(COOLDOWN_MS);
      setTitle("");
      setBody("");
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
        className="w-full p-2 mb-4 bg-foreground rounded-md border border-black text-white placeholder-gray-300"
      />

      <textarea
        placeholder="Body"
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
          disabled={loading || cooldown > 0}
        >
          {cooldown > 0
            ? `Wait ${Math.ceil(cooldown / 60000)}m`
            : loading
            ? "Submitting..."
            : "Submit"}
        </button>
      </div>
    </div>
  );
}
