"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Virtuoso } from "react-virtuoso";
import { useConfessionsContext } from "@/providers/confessions-provider";
import { ConfessionCard } from "@/components/confession-card";
import ConfessionForm from "@/components/confession-form";
import { FlickeringGrid } from "@/components/flickering-grid";

export default function Home() {
  const { confessions, loading } = useConfessionsContext();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="p-6 bg-white/70 backdrop-blur-md border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <p className="text-gray-800 font-bold">Loading confessions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen flex flex-col items-center relative">
      {/* FlickeringGrid Background */}
      <div className="fixed inset-0 -z-10 h-screen w-full">
        <FlickeringGrid
          className="absolute inset-0 size-full"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.35}
          flickerChance={0.12}
        />
        {/* Overlay to soften the background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-purple-50/40 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="w-full p-6 sm:p-12 flex flex-col items-center relative z-10">
        <main className="w-full max-w-3xl flex flex-col gap-8 flex-grow">
          <div className="w-full p-4 bg-white/70 backdrop-blur-sm border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative flex justify-center items-center">
            <h1 className="text-3xl font-bold text-center text-gray-900">
              Confessions
            </h1>
            <button
              onClick={() => setShowForm(true)}
              className="absolute right-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-black rounded-md shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:scale-105 transition font-bold"
            >
              + Confess!
            </button>
          </div>

          {/* Virtuoso container for confessions */}
          <div className="flex-1 w-full border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-white/70 backdrop-blur-sm overflow-hidden">
            <Virtuoso
              data={confessions}
              itemContent={(index, confession) => (
                <div className="p-4 border-b-2 border-gray-300 last:border-b-0">
                  <ConfessionCard
                    key={confession.id}
                    id={confession.id}
                    title={confession.title ?? "Untitled"}
                    body={confession.body ?? ""}
                    created_at={confession.created_at ?? ""}
                    upvotes={confession.upvotes ?? 0}
                    downvotes={confession.downvotes ?? 0}
                    index={index}
                  />
                </div>
              )}
              style={{ height: "60vh" }} // Adjust height as needed
              overscan={200} // Improves scroll performance
            />
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal for confession form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <ConfessionForm onClose={() => setShowForm(false)} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 text-center text-sm text-gray-700 bg-white/70 backdrop-blur-sm border-4 border-black rounded-lg px-6 py-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      Created with <span className="font-semibold text-green-600">Netlify</span>{" "}
      + <span className="font-semibold text-emerald-600">Supabase</span> — By{" "}
      <span className="font-semibold text-pink-600">---redacted :3</span>
    </footer>
  );
}
