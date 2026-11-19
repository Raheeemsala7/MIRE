import "./globals.css";
import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
      <main className="min-h-screen bg-[#fdfbf7] text-[#1c1a1f] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-6xl font-serif tracking-widest text-[#746078] mb-4">
          MIRÉ
        </h1>
        <h2 className="text-xl font-medium mb-2">404 — Page Not Found</h2>
        <p className="text-sm text-[#6f6772] max-w-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[#746078] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#5c4960] transition-colors"
        >
          Return to Home
        </Link>
      </main>
  );
}

