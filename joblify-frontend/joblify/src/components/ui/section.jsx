import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const sectionVariants = cva(
  "py-16 lg:py-20",
  {
    variants: {
      variant: {
        default: "bg-background",
        secondary: "bg-secondary",
        muted: "bg-muted",
        card: "bg-card",
        glass: "bg-white/5 backdrop-blur-sm",
        gradient: "bg-gradient-to-b from-secondary to-background",
        dark: "bg-gray-900 text-white",
        light: "bg-gray-50 text-gray-900",
      },
      size: {
        sm: "py-12 lg:py-16",
        default: "py-16 lg:py-20",
        lg: "py-20 lg:py-24",
        xl: "py-24 lg:py-32",
      },
      pattern: {
        none: "",
        dots: "bg-pattern-dots opacity-5",
        grid: "bg-pattern-grid opacity-5",
        waves: "bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pattern: "none",
    },
  }
)

const Section = React.forwardRef(({ className, variant, size, pattern, children, ...props }, ref) => (
  <section ref={ref} className={cn(sectionVariants({ variant, size, pattern, className }))} {...props}>
    {pattern !== "none" && <div className={cn("absolute inset-0", pattern)} />}
    <div className="container mx-auto px-4 relative z-10">
      {children}
    </div>
  </section>
))
Section.displayName = "Section"

const SectionHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("text-center mb-12 lg:mb-16", className)} {...props}>
    {children}
  </div>
))
SectionHeader.displayName = "SectionHeader"

const SectionTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gradient", className)} {...props}>
    {children}
  </h2>
))
SectionTitle.displayName = "SectionTitle"

const SectionSubtitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed", className)} {...props}>
    {children}
  </p>
))
SectionSubtitle.displayName = "SectionSubtitle"

const SectionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
SectionContent.displayName = "SectionContent"

const SectionGrid = React.forwardRef(({ className, cols = 3, gap = "gap-6 lg:gap-8", children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "grid",
      gap,
      cols === 1 && "grid-cols-1",
      cols === 2 && "grid-cols-1 md:grid-cols-2",
      cols === 3 && "grid-cols-1 md:grid-cols-3",
      cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      cols === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
      cols === 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
      className
    )} 
    {...props}
  >
    {children}
  </div>
))
SectionGrid.displayName = "SectionGrid"

export { Section, SectionHeader, SectionTitle, SectionSubtitle, SectionContent, SectionGrid, sectionVariants } 