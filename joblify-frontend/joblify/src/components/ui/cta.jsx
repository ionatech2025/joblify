import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const ctaVariants = cva(
  "py-16 lg:py-20 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white",
        dark: "bg-gray-900 text-white",
        light: "bg-gray-50 text-gray-900",
        premium: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
      },
      size: {
        sm: "py-12 lg:py-16",
        default: "py-16 lg:py-20",
        lg: "py-20 lg:py-24",
        xl: "py-24 lg:py-32",
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

const CTASection = React.forwardRef(({ className, variant, size, pattern, children, ...props }, ref) => (
  <section ref={ref} className={cn(ctaVariants({ variant, size, pattern, className }))} {...props}>
    {pattern !== "none" && <div className={cn("absolute inset-0", pattern)} />}
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
    <div className="container mx-auto px-4 text-center relative z-10">
      {children}
    </div>
  </section>
))
CTASection.displayName = "CTASection"

const CTATitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-3xl md:text-4xl lg:text-5xl font-bold mb-6", className)} {...props}>
    {children}
  </h2>
))
CTATitle.displayName = "CTATitle"

const CTADescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed", className)} {...props}>
    {children}
  </p>
))
CTADescription.displayName = "CTADescription"

const CTAActions = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-wrap justify-center gap-4", className)} {...props}>
    {children}
  </div>
))
CTAActions.displayName = "CTAActions"

const CTABackground = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("absolute top-0 left-0 w-full h-full", className)} {...props}>
    {children}
  </div>
))
CTABackground.displayName = "CTABackground"

const CTABlob = React.forwardRef(({ className, position = "top-10 left-20", size = "w-64 h-64", delay = "", ...props }, ref) => (
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
CTABlob.displayName = "CTABlob"

export { CTASection, CTATitle, CTADescription, CTAActions, CTABackground, CTABlob, ctaVariants } 