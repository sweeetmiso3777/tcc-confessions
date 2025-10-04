"use client";
import { useState } from "react";
import { useConfessions, type Confession } from "@/hooks/useConfessions";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { motion } from "framer-motion";

const VOTE_COOLDOWN_MS = 10_000; // 10 seconds

interface ConfessionCardProps extends Confession {
  index?: number;
}

export function ConfessionCard({
  id,
  title,
  body,
  created_at,
  index = 0,
}: ConfessionCardProps) {
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
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1.01 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.1,
      }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="p-6 bg-white/20 backdrop-blur-sm border-4 border-black rounded-lg shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex flex-col gap-3"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
      <p className="flex-1 text-gray-800">{body}</p>
      <p className="text-sm text-gray-700">
        {created_at ? new Date(created_at).toLocaleString() : "Unknown date"}
      </p>

      <div className="flex items-center mt-2">
        <div className="inline-flex rounded-lg overflow-hidden border-2 border-black bg-gray-200">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote("up")}
            disabled={isOnCooldown}
            className={`flex items-center gap-2 px-3 py-1 transition ${
              isOnCooldown
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-300 hover:bg-green-400"
            }`}
          >
            <ArrowBigUp className="w-5 h-5" />
            {upvotes}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote("down")}
            disabled={isOnCooldown}
            className={`flex items-center gap-2 px-3 py-1 transition ${
              isOnCooldown
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-300 hover:bg-red-400"
            }`}
          >
            <ArrowBigDown className="w-5 h-5" />
            {downvotes}
          </motion.button>
        </div>
      </div>

      {isOnCooldown && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-600 mt-1"
        >
          Thank you!
        </motion.p>
      )}
    </motion.div>
  );
}
