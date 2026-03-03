import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const newsletterVariants = cva(
  "rounded-2xl p-8 border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/20",
        secondary: "bg-gradient-to-r from-secondary/5 to-secondary/10 border-secondary/20 hover:from-secondary/10 hover:to-secondary/20",
        glass: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20",
        outline: "bg-transparent border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5",
        premium: "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100",
      },
      size: {
        sm: "p-6",
        default: "p-8",
        lg: "p-10",
        xl: "p-12",
      },
      layout: {
        default: "text-center",
        left: "text-left",
        right: "text-right",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "default",
    },
  }
)

const NewsletterCard = React.forwardRef(({ className, variant, size, layout, children, ...props }, ref) => (
  <div ref={ref} className={cn(newsletterVariants({ variant, size, layout, className }))} {...props}>
    {children}
  </div>
))
NewsletterCard.displayName = "NewsletterCard"

const NewsletterHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-6", className)} {...props}>
    {children}
  </div>
))
NewsletterHeader.displayName = "NewsletterHeader"

const NewsletterTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-bold mb-4 text-foreground", className)} {...props}>
    {children}
  </h3>
))
NewsletterTitle.displayName = "NewsletterTitle"

const NewsletterDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-muted-foreground mb-6 leading-relaxed", className)} {...props}>
    {children}
  </p>
))
NewsletterDescription.displayName = "NewsletterDescription"

const NewsletterForm = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col sm:flex-row gap-3 max-w-md mx-auto", className)} {...props}>
    {children}
  </div>
))
NewsletterForm.displayName = "NewsletterForm"

const NewsletterInput = React.forwardRef(({ className, placeholder = "Enter your email", type = "email", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    placeholder={placeholder}
    className={cn(
      "flex-1 px-4 py-3 rounded-lg border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
NewsletterInput.displayName = "NewsletterInput"

const NewsletterButton = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
NewsletterButton.displayName = "NewsletterButton"

const NewsletterGrid = React.forwardRef(({ className, cols = 1, gap = "gap-6", children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "grid",
      gap,
      cols === 1 && "grid-cols-1",
      cols === 2 && "grid-cols-1 md:grid-cols-2",
      cols === 3 && "grid-cols-1 md:grid-cols-3",
      className
    )} 
    {...props}
  >
    {children}
  </div>
))
NewsletterGrid.displayName = "NewsletterGrid"

export { 
  NewsletterCard, 
  NewsletterHeader, 
  NewsletterTitle, 
  NewsletterDescription, 
  NewsletterForm, 
  NewsletterInput, 
  NewsletterButton, 
  NewsletterGrid, 
  newsletterVariants 
} 