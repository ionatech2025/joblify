import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const layoutVariants = cva(
  "min-h-screen flex flex-col",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        dark: "bg-gray-900 text-white",
        light: "bg-gray-50 text-gray-900",
        gradient: "bg-gradient-to-br from-primary/5 via-background to-secondary/5",
      },
      spacing: {
        none: "",
        sm: "space-y-4",
        default: "space-y-6",
        lg: "space-y-8",
        xl: "space-y-12",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
    },
  }
)

const Layout = React.forwardRef(({ className, variant, spacing, children, ...props }, ref) => (
  <div ref={ref} className={cn(layoutVariants({ variant, spacing, className }))} {...props}>
    {children}
  </div>
))
Layout.displayName = "Layout"

const LayoutHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <header ref={ref} className={cn("", className)} {...props}>
    {children}
  </header>
))
LayoutHeader.displayName = "LayoutHeader"

const LayoutMain = React.forwardRef(({ className, children, ...props }, ref) => (
  <main ref={ref} className={cn("flex-1", className)} {...props}>
    {children}
  </main>
))
LayoutMain.displayName = "LayoutMain"

const LayoutFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <footer ref={ref} className={cn("", className)} {...props}>
    {children}
  </footer>
))
LayoutFooter.displayName = "LayoutFooter"

const LayoutSidebar = React.forwardRef(({ className, children, ...props }, ref) => (
  <aside ref={ref} className={cn("", className)} {...props}>
    {children}
  </aside>
))
LayoutSidebar.displayName = "LayoutSidebar"

const LayoutContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
LayoutContent.displayName = "LayoutContent"

const LayoutContainer = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("container mx-auto px-4", className)} {...props}>
    {children}
  </div>
))
LayoutContainer.displayName = "LayoutContainer"

const LayoutGrid = React.forwardRef(({ 
  className, 
  cols = 1, 
  gap = "gap-6", 
  children, 
  ...props 
}, ref) => (
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
LayoutGrid.displayName = "LayoutGrid"

const LayoutFlex = React.forwardRef(({ 
  className, 
  direction = "row", 
  justify = "start", 
  align = "start", 
  wrap = "nowrap", 
  gap = "gap-4", 
  children, 
  ...props 
}, ref) => {
  const directionClasses = {
    row: "flex-row",
    "row-reverse": "flex-row-reverse",
    col: "flex-col",
    "col-reverse": "flex-col-reverse",
  }

  const justifyClasses = {
    start: "justify-start",
    end: "justify-end",
    center: "justify-center",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }

  const alignClasses = {
    start: "items-start",
    end: "items-end",
    center: "items-center",
    baseline: "items-baseline",
    stretch: "items-stretch",
  }

  const wrapClasses = {
    nowrap: "flex-nowrap",
    wrap: "flex-wrap",
    "wrap-reverse": "flex-wrap-reverse",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "flex",
        directionClasses[direction],
        justifyClasses[justify],
        alignClasses[align],
        wrapClasses[wrap],
        gap,
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
LayoutFlex.displayName = "LayoutFlex"

const LayoutSection = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  pattern = "none", 
  children, 
  ...props 
}, ref) => {
  const sectionVariants = {
    default: "bg-background",
    secondary: "bg-secondary",
    muted: "bg-muted",
    card: "bg-card",
    glass: "bg-white/5 backdrop-blur-sm",
    gradient: "bg-gradient-to-b from-secondary to-background",
    dark: "bg-gray-900 text-white",
    light: "bg-gray-50 text-gray-900",
  }

  const sectionSizes = {
    sm: "py-12 lg:py-16",
    default: "py-16 lg:py-20",
    lg: "py-20 lg:py-24",
    xl: "py-24 lg:py-32",
  }

  const sectionPatterns = {
    none: "",
    dots: "bg-pattern-dots opacity-5",
    grid: "bg-pattern-grid opacity-5",
    waves: "bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10",
  }

  return (
    <section 
      ref={ref} 
      className={cn(
        "relative",
        sectionVariants[variant],
        sectionSizes[size],
        className
      )} 
      {...props}
    >
      {sectionPatterns[pattern] !== "none" && (
        <div className={cn("absolute inset-0", sectionPatterns[pattern])} />
      )}
      <div className="container mx-auto px-4 relative z-10">
        {children}
      </div>
    </section>
  )
})
LayoutSection.displayName = "LayoutSection"

export { 
  Layout, 
  LayoutHeader, 
  LayoutMain, 
  LayoutFooter, 
  LayoutSidebar, 
  LayoutContent, 
  LayoutContainer, 
  LayoutGrid, 
  LayoutFlex, 
  LayoutSection, 
  layoutVariants 
} 