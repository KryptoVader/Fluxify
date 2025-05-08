"use client";

import { useState, useEffect } from "react";
import ConversionForm from '@/components/ConversionForm';
import { Header } from "@/components/Header";
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE } from "@/lib/constants";
import { ArrowRight, FileType, Zap, Shield, Clock, ChevronDown, Star } from "lucide-react";

type AnimatedBlobProps = {
  className?: string;
};

type AnimatedCounterProps = {
  value: number;
  label: string;
};

type FeatureCardProps = {
  icon: JSX.Element;
  title: string;
  description: string;
};

type TestimonialCardProps = {
  quote: string;
  author: string;
  role: string;
};

// TypeWriter Animation Component
const TypeWriterAnimation = () => {
  const [displayText, setDisplayText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  
  // Define the phrases to cycle through
  const phrases = [
    "File conversion reimagined",
    "Document transformation simplified",
    "Format conversion perfected",
    "File conversion redefined",
    "Media conversion streamlined"
  ];
  
  useEffect(() => {
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    
    // Handle cursor blinking - slower blink rate
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 700);
    
    // Create a controlled, predictable animation with consistent timing
    const animate = () => {
      const currentPhrase = phrases[currentPhraseIndex];
      
      // Set a baseline speed that's much slower and consistent
      let delay = 120; // Base typing delay - much slower
      
      if (isDeleting) {
        // Deleting text
        setDisplayText(currentPhrase.substring(0, currentCharIndex - 1));
        currentCharIndex -= 1;
        
        // Consistent delete speed
        delay = 80;
      } else {
        // Typing text
        setDisplayText(currentPhrase.substring(0, currentCharIndex + 1));
        currentCharIndex += 1;
      }
      
      // Control the state transitions with predictable timing
      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        // Pause at the end of typing before starting to delete
        delay = 2000; // 2 second pause when phrase is complete
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        // Move to next phrase
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        delay = 1000; // 1 second pause between phrases
      }
      
      // Schedule the next frame with consistent timing
      setTimeout(animate, delay);
    };
    
    // Start the animation
    setTimeout(animate, 1000); // Initial delay before starting
    
    return () => {
      clearInterval(cursorInterval);
    };
  }, []);
  
  return (
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      {displayText}
      <span className={`inline-block w-1 h-14 bg-primary ml-1 transition-opacity duration-500 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
    </h1>
  );
};

// Animated gradient blob component
const AnimatedBlob = ({ className }: AnimatedBlobProps) => {
  return (
    <div className={`absolute rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-3xl animate-blob ${className}`}></div>
  );
};

// Animated counter component
const AnimatedCounter = ({ value, label }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev < value) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-primary">{count}+</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

// Feature card with hover animation
const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="p-8 rounded-2xl bg-background border border-muted hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:-translate-y-1">
      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

// Testimonial card component
const TestimonialCard = ({ quote, author, role }: TestimonialCardProps) => {
  return (
    <div className="p-6 rounded-xl bg-background border">
      <div className="flex mb-4 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="italic text-muted-foreground mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-medium">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  );
};

// Add your keyframes for animations
const keyframes = `
  @keyframes blob {
    0% {
      transform: translate(0px, 0px) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
      transform: translate(0px, 0px) scale(1);
    }
  }
`;

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const fadeInClass = isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8";
  
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Using Tailwind's built-in animations */}
      
      <Header />
      
      {/* Hero Section with animated blobs */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <AnimatedBlob className="left-1/4 -top-32 w-72 h-72 opacity-60 animate-pulse" />
        <AnimatedBlob className="right-1/4 top-48 w-96 h-96 opacity-40 animate-bounce" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`transition-all duration-1000 ease-out ${fadeInClass}`}>
              {/* TypeWriter animation */}
              <TypeWriterAnimation />
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                {APP_DESCRIPTION}
              </p>
            </div>
            
            {/* Conversion Form */}
            <div className={`relative z-10 transition-all duration-1000 ease-out delay-300 ${fadeInClass}`}>
              <ConversionForm />
            </div>
            
            {/* Scroll indicator */}
            <div className="mt-16 animate-bounce">
              <ChevronDown className="mx-auto h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 border-y border-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value={98} label="Formats Supported" />
            <AnimatedCounter value={250} label="Conversions Daily" />
            <AnimatedCounter value={99} label="Customer Satisfaction" />
            <AnimatedCounter value={50} label="Processing Speed" />
          </div>
        </div>
      </section>

      {/* Features Section with hover animations */}
      <section className="py-24 bg-background relative">
        <AnimatedBlob className="left-0 bottom-0 w-64 h-64 opacity-30 animate-pulse" />
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Converter?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Experience the difference with our professional-grade conversion tools designed for efficiency and reliability.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-7 w-7 text-primary" />}
              title="Lightning Fast"
              description="Convert your files in seconds with our optimized processing engine and state-of-the-art algorithms."
            />

            <FeatureCard 
              icon={<Shield className="h-7 w-7 text-primary" />}
              title="Secure & Private"
              description="Your files are processed locally and never stored on our servers. Your privacy is our top priority."
            />

            <FeatureCard 
              icon={<FileType className="h-7 w-7 text-primary" />}
              title="Wide Format Support"
              description="Convert between dozens of formats with professional-grade quality and perfect fidelity."
            />
            
            <FeatureCard 
              icon={<Clock className="h-7 w-7 text-primary" />}
              title="Batch Processing"
              description="Save time by converting multiple files simultaneously with our efficient batch processing system."
            />
            
            <FeatureCard 
              icon={<Star className="h-7 w-7 text-primary" />}
              title="Premium Quality"
              description="Maintain the highest quality in your conversions with our advanced rendering technology."
            />
            
            <FeatureCard 
              icon={<ArrowRight className="h-7 w-7 text-primary" />}
              title="Intuitive Workflow"
              description="Our streamlined process makes file conversion simple enough for anyone to use with confidence."
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24 bg-muted/20 relative">
        <AnimatedBlob className="right-0 top-24 w-80 h-80 opacity-40 animate-bounce" />
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Join thousands of satisfied users who trust our conversion tool daily</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard 
              quote="This converter saved me hours of work. The quality is impeccable and the speed is unmatched."
              author="Alex Johnson"
              role="Graphic Designer"
            />
            <TestimonialCard 
              quote="Finally a conversion tool that doesn't compromise on quality! I use it for all my client work now."
              author="Maria Rodriguez"
              role="Content Creator"
            />
            <TestimonialCard 
              quote="The batch processing feature is a game-changer for my team's workflow. Highly recommended!"
              author="James Chen"
              role="Project Manager"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background relative overflow-hidden">
        <AnimatedBlob className="left-1/3 bottom-0 w-96 h-96 opacity-50 animate-pulse" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Ready to Convert Your Files?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the fastest, most secure file conversion tool available today.
          </p>
          <button className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-gray-900 dark:text-white font-medium transition-colors flex items-center mx-auto group shadow-sm hover:shadow-md">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}