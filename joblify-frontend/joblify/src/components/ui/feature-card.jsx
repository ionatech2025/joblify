import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const featureCardVariants = cva(
  "text-center p-8 rounded-2xl transition-all duration-300 relative",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/50 hover:border-border/80 hover:shadow-lg",
        elevated: "bg-card shadow-md hover:shadow-xl hover:-translate-y-1 border-0",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20",
        gradient: "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/20",
        outline: "bg-transparent border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5",
        premium: "bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover:from-yellow-100 hover:to-orange-100",
      },
      size: {
        sm: "p-6",
        default: "p-8",
        lg: "p-10",
        xl: "p-12",
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        slide: "animate-slide-up",
        bounce: "animate-bounce-in",
        hover: "hover:scale-105 hover:shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const FeatureCard = React.forwardRef(({ className, variant, size, animation, children, ...props }, ref) => (
  <div ref={ref} className={cn(featureCardVariants({ variant, size, animation, className }))} {...props}>
    {children}
  </div>
))
FeatureCard.displayName = "FeatureCard"

const FeatureIcon = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl", className)} {...props}>
    {children}
  </div>
))
FeatureIcon.displayName = "FeatureIcon"

const FeatureTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold mb-4 text-foreground", className)} {...props}>
    {children}
  </h3>
))
FeatureTitle.displayName = "FeatureTitle"

const FeatureDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-muted-foreground leading-relaxed", className)} {...props}>
    {children}
  </p>
))
FeatureDescription.displayName = "FeatureDescription"

const FeatureNumber = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl font-bold", className)} {...props}>
    {children}
  </div>
))
FeatureNumber.displayName = "FeatureNumber"

const FeatureArrow = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("absolute top-0 right-0 h-full hidden md:block", className)} {...props}>
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/30 mt-8"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  </div>
))
FeatureArrow.displayName = "FeatureArrow"

const FeatureGrid = React.forwardRef(({ className, cols = 3, children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "grid gap-8",
      cols === 1 && "grid-cols-1",
      cols === 2 && "grid-cols-1 md:grid-cols-2",
      cols === 3 && "grid-cols-1 md:grid-cols-3",
      cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )} 
    {...props}
  >
    {children}
  </div>
))
FeatureGrid.displayName = "FeatureGrid"

export { FeatureCard, FeatureIcon, FeatureTitle, FeatureDescription, FeatureNumber, FeatureArrow, FeatureGrid, featureCardVariants } 