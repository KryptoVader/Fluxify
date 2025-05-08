// app/supported-formats/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Home } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";

export default function SupportedFormatsPage() {
  const [formatsMap, setFormatsMap] = useState<Record<string,string[]>|null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/supported-formats")
      .then(res => res.json())
      .then(data => setFormatsMap(data));
  }, []);

  if (!formatsMap) {
    return <p className="text-center py-12">Loading formats…</p>;
  }

  const entries = Object.entries(formatsMap)
    .filter(([input]) => input.toLowerCase().includes(filter.trim().toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const cardVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      {/* Navbar */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo group: padded by container px-4, not flush */}
          <Link href="/" className="flex items-center gap-2">
  <Layers className="h-6 w-6 text-primary" />
  <span className="font-medium text-lg">Fluxify</span>
</Link>
          {/* Controls group */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Try the Converter
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-12 px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Supported Formats</h1>
          <p className="text-muted-foreground">
            See what file types you can convert—and into which formats.
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <Input
            placeholder="Filter formats…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md w-full"
          />
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {entries.map(([input, outputs]) => (
            <motion.div
              key={input}
              variants={cardVariants}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="h-full border-2 border-black dark:border-white bg-card rounded-lg">
                <div className="pb-2 border-b border-border px-4 pt-4">
                  <h3 className="text-lg font-semibold">{input.toUpperCase()}</h3>
                </div>
                <div className="pt-2 space-y-1 p-4">
                  <div className="flex flex-wrap gap-2">
                    {outputs.map((out) => (
                      <span key={out} className="px-2 py-1 border border-current rounded-md text-sm">
                        {out.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
