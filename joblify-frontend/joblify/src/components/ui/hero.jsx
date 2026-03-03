import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const heroVariants = cva(
  "relative py-24 lg:py-32 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground",
        secondary: "bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-secondary-foreground",
        muted: "bg-gradient-to-br from-muted via-muted/90 to-muted/80 text-foreground",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white",
        dark: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white",
        light: "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900",
      },
      size: {
        sm: "py-16 lg:py-20",
        default: "py-24 lg:py-32",
        lg: "py-32 lg:py-40",
        xl: "py-40 lg:py-48",
      },
      pattern: {
        none: "",
        dots: "bg-pattern-dots opacity-10",
        grid: "bg-pattern-grid opacity-10",
        waves: "bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pattern: "none",
    },
  }
)

const HeroSection = React.forwardRef(({ className, variant, size, pattern, children, ...props }, ref) => (
  <section ref={ref} className={cn(heroVariants({ variant, size, pattern, className }))} {...props}>
    {pattern !== "none" && <div className={cn("absolute inset-0", pattern)} />}
    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      {children}
    </div>
  </section>
))
HeroSection.displayName = "HeroSection"

const HeroContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("max-w-4xl mx-auto text-center", className)} {...props}>
    {children}
  </div>
))
HeroContent.displayName = "HeroContent"

const HeroTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h1 ref={ref} className={cn("text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight", className)} {...props}>
    {children}
  </h1>
))
HeroTitle.displayName = "HeroTitle"

const HeroSubtitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed", className)} {...props}>
    {children}
  </p>
))
HeroSubtitle.displayName = "HeroSubtitle"

const HeroActions = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-wrap justify-center gap-4", className)} {...props}>
    {children}
  </div>
))
HeroActions.displayName = "HeroActions"

const HeroBackground = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("absolute top-0 left-0 w-full h-full", className)} {...props}>
    {children}
  </div>
))
HeroBackground.displayName = "HeroBackground"

const HeroBlob = React.forwardRef(({ className, position = "top-20 left-10", size = "w-72 h-72", delay = "", ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "absolute rounded-full bg-white/10 blur-3xl animate-pulse",
      position,
      size,
      delay && `delay-${delay}`,
      className
    )} 
    {...props} 
  />
))
HeroBlob.displayName = "HeroBlob"

export { HeroSection, HeroContent, HeroTitle, HeroSubtitle, HeroActions, HeroBackground, HeroBlob, heroVariants } 