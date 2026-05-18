import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

const heroVariants = cva(
  "relative overflow-hidden flex items-center",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white",
        primary: "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white",
        dark: "bg-zinc-950 text-white",
        light: "bg-gradient-to-br from-zinc-100 via-white to-zinc-50 text-zinc-900",
        glass: "bg-white/10 backdrop-blur-2xl border border-white/10 text-white",
      },
      size: {
        sm: "py-20",
        default: "py-28 lg:py-36",
        lg: "py-36 lg:py-44",
        xl: "min-h-[100dvh] py-20",
      },
      pattern: {
        none: "",
        subtle: "before:absolute before:inset-0 before:bg-[radial-gradient(#ffffff_0.8px,transparent_1px)] before:[background-size:40px_40px] before:opacity-5",
        grid: "before:absolute before:inset-0 before:bg-grid-white/[0.03]",
        dots: "before:absolute before:inset-0 before:bg-[radial-gradient(#ffffff_1px,transparent_1px)] before:[background-size:50px_50px] before:opacity-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pattern: "none",
    },
  }
);

const HeroSection = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  pattern, 
  children, 
  ...props 
}, ref) => (
  <section 
    ref={ref} 
    className={cn(heroVariants({ variant, size, pattern, className }))} 
    {...props}
  >
    {/* Background Pattern Layer */}
    {pattern !== "none" && <div className="absolute inset-0 z-0" />}

    {/* Overlay Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />

    {/* Decorative Blobs */}
    <div className="absolute inset-0 z-0 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0.6, scale: 1.05 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"
      />
      <motion.div 
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 0.5, scale: 1.08 }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", delay: 5 }}
        className="absolute -bottom-40 right-0 w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-3xl"
      />
    </div>

    <div className="container mx-auto px-6 relative z-20">
      {children}
    </div>
  </section>
));
HeroSection.displayName = "HeroSection";

// Enhanced Content Components
const HeroContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <motion.div 
    ref={ref} 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={cn("max-w-4xl mx-auto text-center", className)} 
    {...props}
  >
    {children}
  </motion.div>
));
HeroContent.displayName = "HeroContent";

const HeroTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <motion.h1 
    ref={ref}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, ease: "easeOut" }}
    className={cn(
      "text-6xl md:text-7xl lg:text-[86px] font-semibold tracking-tighter leading-[1.05] mb-6",
      className
    )} 
    {...props}
  >
    {children}
  </motion.h1>
));
HeroTitle.displayName = "HeroTitle";

const HeroSubtitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <motion.p 
    ref={ref}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.2 }}
    className={cn(
      "text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light tracking-tight",
      className
    )} 
    {...props}
  >
    {children}
  </motion.p>
));
HeroSubtitle.displayName = "HeroSubtitle";

const HeroActions = React.forwardRef(({ className, children, ...props }, ref) => (
  <motion.div 
    ref={ref}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.4 }}
    className={cn("flex flex-wrap justify-center gap-4 mt-10", className)} 
    {...props}
  >
    {children}
  </motion.div>
));
HeroActions.displayName = "HeroActions";

const HeroBackground = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("absolute inset-0 z-0", className)} {...props}>
    {children}
  </div>
));
HeroBackground.displayName = "HeroBackground";

// Export everything
export { 
  HeroSection, 
  HeroContent, 
  HeroTitle, 
  HeroSubtitle, 
  HeroActions, 
  HeroBackground, 
  heroVariants 
};