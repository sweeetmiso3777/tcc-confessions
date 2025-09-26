"use client";

import { useConfessionsContext } from "@/providers/confessions-provider";
import { ConfessionCard } from "@/components/confession-card";

export default function Home() {
  const { confessions, loading } = useConfessionsContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary/30">
        <p className="text-gray-600">Loading confessions…</p>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-12 flex flex-col items-center bg-primary/30">
      {/* Main content */}
      <main className="w-full max-w-3xl flex flex-col gap-8 flex-grow">
        <div className="w-full p-4 bg-primary border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-bold text-center">Confessions</h1>
        </div>

        <div className="flex flex-col gap-6">
          {confessions.map((confession) => (
            <ConfessionCard
              key={confession.id}
              id={confession.id}
              title={confession.title ?? "Untitled"}
              body={confession.body ?? ""}
              created_at={confession.created_at ?? ""}
              upvotes={confession.upvotes ?? 0}
              downvotes={confession.downvotes ?? 0}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 text-center text-sm text-gray-600">
      Created with <span className="font-semibold">Next.js</span> +{" "}
      <span className="font-semibold">Netlify</span> +{" "}
      <span className="font-semibold">Supabase</span> — By{" "}
      <span className="font-semibold">Sweeetmiso3777</span>
    </footer>
  );
}
