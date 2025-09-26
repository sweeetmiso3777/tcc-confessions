"use client";
import { useState } from "react";
import { useConfessions, type Confession } from "@/hooks/useConfessions";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

const VOTE_COOLDOWN_MS = 10_000; // 10 seconds

export function ConfessionCard({ id, title, body, created_at }: Confession) {
  const { confessions, upvoteConfession, downvoteConfession } =
    useConfessions();

  const confession = confessions.find((c) => c.id === id);

  const upvotes = confession?.upvotes ?? 0;
  const downvotes = confession?.downvotes ?? 0;

  // cooldown state
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  const isOnCooldown = Date.now() < cooldownUntil;

  const handleVote = (type: "up" | "down") => {
    if (isOnCooldown) return;

    if (type === "up") {
      upvoteConfession(id);
    } else {
      downvoteConfession(id);
    }

    setCooldownUntil(Date.now() + VOTE_COOLDOWN_MS);
  };

  return (
    <div className="p-6 bg-primary border-4 border-black rounded-lg shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex flex-col gap-3">
      <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
      <p className="flex-1">{body}</p>
      <p className="text-sm text-gray-600">
        {created_at ? new Date(created_at).toLocaleString() : "Unknown date"}
      </p>

      <div className="flex items-center mt-2">
        <div className="inline-flex rounded-lg overflow-hidden border-2 border-black bg-gray-200">
          <button
            onClick={() => handleVote("up")}
            disabled={isOnCooldown}
            className={`flex items-center gap-2 px-3 py-1 transition ${
              isOnCooldown
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-300 hover:bg-green-400 active:translate-y-0.5"
            }`}
          >
            <ArrowBigUp className="w-5 h-5" />
            {upvotes}
          </button>

          <button
            onClick={() => handleVote("down")}
            disabled={isOnCooldown}
            className={`flex items-center gap-2 px-3 py-1 transition ${
              isOnCooldown
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-300 hover:bg-red-400 active:translate-y-0.5"
            }`}
          >
            <ArrowBigDown className="w-5 h-5" />
            {downvotes}
          </button>
        </div>
      </div>

      {isOnCooldown && ""}
    </div>
  );
}
