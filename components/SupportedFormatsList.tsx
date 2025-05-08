// components/SupportedFormatsList.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface SupportedFormatsListProps {
  formatsMap: Record<string, string[]>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function SupportedFormatsList({ formatsMap }: SupportedFormatsListProps) {
  const [filter, setFilter] = useState("");

  const entries = Object.entries(formatsMap)
    .filter(([input]) =>
      input.toLowerCase().includes(filter.trim().toLowerCase())
    )
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8">
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
            <Card className="h-full border-2 border-white bg-card">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-lg">{input.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1">
                <div className="flex flex-wrap gap-2">
                  {outputs.map((out) => (
                    <Badge key={out} variant="outline">
                      {out.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <div className="text-center">
        <Link href="/">
          <Button size="lg">Try the Converter</Button>
        </Link>
      </div>
    </div>
  );
}
