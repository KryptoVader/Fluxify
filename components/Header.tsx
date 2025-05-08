"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Layers, File, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

export function Header() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);

  return (
    <motion.header
  className={cn("fixed top-0 z-50 w-full backdrop-blur-md transition-colors")}
  style={{
    backgroundColor: "hsl(var(--background) / var(--bg-opacity))",
    borderBottom: "1px solid hsl(var(--border) / var(--border-opacity))",
    "--bg-opacity": bgOpacity,
    "--border-opacity": borderOpacity,
  } as any}
>
  <div className="w-full px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto flex h-16 items-center justify-between">
    {/* Left: Logo */}
    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
      <Layers className="h-6 w-6 text-primary" />
      <span>{APP_NAME}</span>
    </Link>

    {/* Center: Desktop Nav */}
    <div className="hidden md:flex items-center gap-6">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/supported-formats" legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md",
                  "hover:bg-accent hover:text-accent-foreground transition-colors"
                )}
              >
                <File className="h-4 w-4" />
                <span>Supported Formats</span>
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button>Get Started</Button>
      </div>
    </div>

    {/* Right: Mobile Nav */}
    <div className="flex md:hidden items-center gap-2">
      <ModeToggle />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate to different sections of {APP_NAME}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-6">
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/supported-formats">
                <File className="mr-2 h-4 w-4" />
                Supported Formats
              </Link>
            </Button>
            <Button>Get Started</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </div>
</motion.header>
  );
}
