"use client";
import { useConfessions, type Confession } from "@/hooks/useConfessions";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { motion } from "framer-motion";

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

  const handleVote = (type: "up" | "down") => {
    if (type === "up") upvoteConfession(id);
    else downvoteConfession(id);
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
            className="flex items-center gap-2 px-3 py-1 bg-green-300 hover:bg-green-400 transition"
          >
            <ArrowBigUp className="w-5 h-5" />
            {upvotes}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote("down")}
            className="flex items-center gap-2 px-3 py-1 bg-red-300 hover:bg-red-400 transition"
          >
            <ArrowBigDown className="w-5 h-5" />
            {downvotes}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
