"use client";
import { useState } from "react";
import { Plus } from "lucide-react"; // npm i lucide-react

export default function ConfessionForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

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

      {/* Overlay & Form */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div
            className="max-w-md w-full p-6 bg-primary border-4 border-black
                          shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-bold mb-4 bg-foreground rounded-md p-2">
              New Confession
            </h2>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 mb-4 bg-foreground rounded-md border border-black"
            />

            <textarea
              placeholder="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 mb-4 bg-foreground rounded-md border border-black h-32"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-foreground border-2 border-black rounded-md shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  console.log({ title, body });
                  setOpen(false);
                }}
                className="px-4 py-2 bg-foreground border-2 border-black rounded-md shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
