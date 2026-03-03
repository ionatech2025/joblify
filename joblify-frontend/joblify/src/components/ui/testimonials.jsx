import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const testimonialVariants = cva(
  "flex flex-col p-6 rounded-2xl transition-all duration-300",
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

const TestimonialCard = React.forwardRef(({ className, variant, size, animation, children, ...props }, ref) => (
  <div ref={ref} className={cn(testimonialVariants({ variant, size, animation, className }))} {...props}>
    {children}
  </div>
))
TestimonialCard.displayName = "TestimonialCard"

const TestimonialRating = React.forwardRef(({ className, rating = 5, maxRating = 5, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center mb-4", className)} {...props}>
    {[...Array(maxRating)].map((_, i) => (
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={i < rating ? "currentColor" : "none"}
        stroke="currentColor"
        className={cn(
          "w-5 h-5 mr-1",
          i < rating ? "text-yellow-500 fill-current" : "text-yellow-500/30"
        )}
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    ))}
  </div>
))
TestimonialRating.displayName = "TestimonialRating"

const TestimonialQuote = React.forwardRef(({ className, children, ...props }, ref) => (
  <blockquote ref={ref} className={cn("text-lg mb-6 flex-1 italic leading-relaxed text-muted-foreground", className)} {...props}>
    "{children}"
  </blockquote>
))
TestimonialQuote.displayName = "TestimonialQuote"

const TestimonialAuthor = React.forwardRef(({ className, avatar, name, title, company, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props}>
    {avatar && (
      <img
        src={avatar}
        alt={name}
        className="w-12 h-12 rounded-full mr-4 border-2 border-primary/20"
      />
    )}
    <div>
      <p className="font-semibold text-lg text-foreground">{name}</p>
      <p className="text-muted-foreground">
        {title}{company && `, ${company}`}
      </p>
    </div>
  </div>
))
TestimonialAuthor.displayName = "TestimonialAuthor"

const TestimonialsGrid = React.forwardRef(({ className, cols = 3, children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "grid gap-6 md:gap-8",
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
TestimonialsGrid.displayName = "TestimonialsGrid"

export { TestimonialCard, TestimonialRating, TestimonialQuote, TestimonialAuthor, TestimonialsGrid, testimonialVariants } 