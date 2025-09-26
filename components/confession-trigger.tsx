"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ConfessionForm from "./confession-form";

export default function ConfessionTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating + button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-primary border-4 border-black
                   shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-4 rounded-full
                   hover:translate-y-[-2px] active:translate-y-[1px]
                   transition-transform"
      >
        <Plus className="w-6 h-6 text-black" />
      </button>

      {/* Overlay + Form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.5, x: 200, y: 200, opacity: 0 }}
              animate={{ scale: 1, x: 0, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, x: 200, y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ConfessionForm onClose={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
