import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const statsVariants = cva(
  "flex flex-col items-center justify-center text-center p-6 rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/50 hover:border-border/80 hover:shadow-lg",
        elevated: "bg-card shadow-md hover:shadow-xl hover:-translate-y-1 border-0",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20",
        gradient: "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/20",
        outline: "bg-transparent border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        slide: "animate-slide-up",
        bounce: "animate-bounce-in",
        hover: "hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const StatsCard = React.forwardRef(({ className, variant, size, animation, children, ...props }, ref) => (
  <div ref={ref} className={cn(statsVariants({ variant, size, animation, className }))} {...props}>
    {children}
  </div>
))
StatsCard.displayName = "StatsCard"

const StatsIcon = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300", className)} {...props}>
    {children}
  </div>
))
StatsIcon.displayName = "StatsIcon"

const StatsValue = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("text-3xl md:text-4xl font-bold text-foreground mb-2", className)} {...props}>
    {children}
  </div>
))
StatsValue.displayName = "StatsValue"

const StatsLabel = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm md:text-base text-muted-foreground font-medium", className)} {...props}>
    {children}
  </div>
))
StatsLabel.displayName = "StatsLabel"

const StatsGrid = React.forwardRef(({ className, cols = 4, children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "grid gap-6 md:gap-8",
      cols === 2 && "grid-cols-2",
      cols === 3 && "grid-cols-1 md:grid-cols-3",
      cols === 4 && "grid-cols-2 md:grid-cols-4",
      cols === 5 && "grid-cols-2 md:grid-cols-5",
      cols === 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
      className
    )} 
    {...props}
  >
    {children}
  </div>
))
StatsGrid.displayName = "StatsGrid"

export { StatsCard, StatsIcon, StatsValue, StatsLabel, StatsGrid, statsVariants } 