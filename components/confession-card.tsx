"use client";
import { useConfessions, type Confession } from "@/hooks/useConfessions";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ConfessionCardProps extends Confession {
  index?: number;
}

export function ConfessionCard({
  id,
  title,
  body,
  created_at,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  index = 0,
}: ConfessionCardProps) {
  const { upvoteConfession, downvoteConfession, getUserVote } =
    useConfessions();
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [displayUpvotes, setDisplayUpvotes] = useState(initialUpvotes);
  const [displayDownvotes, setDisplayDownvotes] = useState(initialDownvotes);
  const [targetUpvotes, setTargetUpvotes] = useState(initialUpvotes);
  const [targetDownvotes, setTargetDownvotes] = useState(initialDownvotes);

  // Load user's vote when component mounts
  useEffect(() => {
    const loadUserVote = async () => {
      const vote = await getUserVote(id);
      setUserVote(vote);
    };
    loadUserVote();
  }, [id, getUserVote]);

  // Animate vote counts
  useEffect(() => {
    if (displayUpvotes !== targetUpvotes) {
      const timer = setTimeout(() => {
        setDisplayUpvotes((prev) => {
          if (prev < targetUpvotes) return prev + 1;
          if (prev > targetUpvotes) return prev - 1;
          return prev;
        });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [displayUpvotes, targetUpvotes]);

  useEffect(() => {
    if (displayDownvotes !== targetDownvotes) {
      const timer = setTimeout(() => {
        setDisplayDownvotes((prev) => {
          if (prev < targetDownvotes) return prev + 1;
          if (prev > targetDownvotes) return prev - 1;
          return prev;
        });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [displayDownvotes, targetDownvotes]);

  const handleVote = (type: "up" | "down") => {
    const isSameVote = userVote === type;
    const newVote = isSameVote ? null : type;

    // Update local vote state immediately for UI feedback
    setUserVote(newVote);

    // Calculate new target counts for animation
    let newUpvotes = initialUpvotes;
    let newDownvotes = initialDownvotes;

    // Remove previous vote if exists
    if (userVote === "up") newUpvotes = Math.max(0, newUpvotes - 1);
    if (userVote === "down") newDownvotes = Math.max(0, newDownvotes - 1);

    // Add new vote if not removing
    if (newVote === "up") newUpvotes += 1;
    if (newVote === "down") newDownvotes += 1;

    setTargetUpvotes(newUpvotes);
    setTargetDownvotes(newDownvotes);

    // Call the vote function
    if (newVote === "up") {
      upvoteConfession(id);
    } else if (newVote === "down") {
      downvoteConfession(id);
    } else {
      // If removing vote, call the opposite function to remove it
      if (userVote === "up")
        upvoteConfession(id); // This will remove the upvote
      else if (userVote === "down") downvoteConfession(id); // This will remove the downvote
    }
  };

  // Update targets when props change (from optimistic updates)
  useEffect(() => {
    setTargetUpvotes(initialUpvotes);
    setTargetDownvotes(initialDownvotes);
  }, [initialUpvotes, initialDownvotes]);

  // Determine button styles based on current vote
  const getUpvoteStyle = () => {
    return userVote === "up"
      ? "bg-green-500 text-white"
      : "bg-green-300 hover:bg-green-400";
  };

  const getDownvoteStyle = () => {
    return userVote === "down"
      ? "bg-red-500 text-white"
      : "bg-red-300 hover:bg-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
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
            className={`flex items-center gap-2 px-3 py-1 transition ${getUpvoteStyle()}`}
          >
            <ArrowBigUp className="w-5 h-5" />
            <motion.span
              key={displayUpvotes}
              initial={{ scale: 1.2, y: -5 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {displayUpvotes}
            </motion.span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote("down")}
            className={`flex items-center gap-2 px-3 py-1 transition ${getDownvoteStyle()}`}
          >
            <ArrowBigDown className="w-5 h-5" />
            <motion.span
              key={displayDownvotes}
              initial={{ scale: 1.2, y: -5 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.1 }}
            >
              {displayDownvotes}
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
