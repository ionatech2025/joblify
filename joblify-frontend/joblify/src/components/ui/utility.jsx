import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const utilityVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        primary: "",
        secondary: "",
        muted: "",
        accent: "",
        destructive: "",
        success: "",
        warning: "",
        info: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
        xl: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Utility = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(utilityVariants({ variant, size, className }))} 
    {...props}
  >
    {children}
  </div>
))
Utility.displayName = "Utility"

const Divider = React.forwardRef(({ 
  className, 
  orientation = "horizontal", 
  variant = "default", 
  size = "default", 
  ...props 
}, ref) => {
  const orientationClasses = {
    horizontal: "w-full h-px",
    vertical: "h-full w-px",
  }

  const variantClasses = {
    default: "bg-border",
    primary: "bg-primary/20",
    secondary: "bg-secondary/20",
    muted: "bg-muted",
    accent: "bg-accent",
    destructive: "bg-destructive/20",
    success: "bg-success/20",
    warning: "bg-warning/20",
    info: "bg-info/20",
  }

  const sizeClasses = {
    sm: orientation === "horizontal" ? "my-2" : "mx-2",
    default: orientation === "horizontal" ? "my-4" : "mx-4",
    lg: orientation === "horizontal" ? "my-6" : "mx-6",
    xl: orientation === "horizontal" ? "my-8" : "mx-8",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        orientationClasses[orientation],
        variantClasses[variant],
        sizeClasses[size],
        className
      )} 
      {...props} 
    />
  )
})
Divider.displayName = "Divider"

const Spacer = React.forwardRef(({ 
  className, 
  size = "default", 
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "h-2",
    default: "h-4",
    lg: "h-8",
    xl: "h-16",
  }

  return (
    <div 
      ref={ref} 
      className={cn(sizeClasses[size], className)} 
      {...props} 
    />
  )
})
Spacer.displayName = "Spacer"

const Container = React.forwardRef(({ 
  className, 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "max-w-4xl",
    default: "max-w-6xl",
    lg: "max-w-7xl",
    xl: "max-w-full",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "mx-auto px-4",
        sizeClasses[size],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
Container.displayName = "Container"

const Grid = React.forwardRef(({ 
  className, 
  cols = 1, 
  gap = "gap-4", 
  children, 
  ...props 
}, ref) => {
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "grid",
        colsClasses[cols],
        gap,
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
Grid.displayName = "Grid"

const Flex = React.forwardRef(({ 
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
Flex.displayName = "Flex"

const Stack = React.forwardRef(({ 
  className, 
  direction = "vertical", 
  spacing = "default", 
  children, 
  ...props 
}, ref) => {
  const directionClasses = {
    vertical: "flex-col",
    horizontal: "flex-row",
  }

  const spacingClasses = {
    none: "",
    sm: "space-y-2",
    default: "space-y-4",
    lg: "space-y-6",
    xl: "space-y-8",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "flex",
        directionClasses[direction],
        spacingClasses[spacing],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
Stack.displayName = "Stack"

const Center = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("flex items-center justify-center", className)} 
    {...props}
  >
    {children}
  </div>
))
Center.displayName = "Center"

const AspectRatio = React.forwardRef(({ 
  className, 
  ratio = "16/9", 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("relative w-full", className)} 
    style={{ aspectRatio: ratio }}
    {...props}
  >
    {children}
  </div>
))
AspectRatio.displayName = "AspectRatio"

const VisuallyHidden = React.forwardRef(({ className, children, ...props }, ref) => (
  <span 
    ref={ref} 
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      className
    )} 
    {...props}
  >
    {children}
  </span>
))
VisuallyHidden.displayName = "VisuallyHidden"

const FocusTrap = React.forwardRef(({ className, children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("focus-trap", className)} 
    {...props}
  >
    {children}
  </div>
))
FocusTrap.displayName = "FocusTrap"

const Portal = React.forwardRef(({ className, children, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div 
      ref={ref} 
      className={cn("portal", className)} 
      {...props}
    >
      {children}
    </div>
  )
})
Portal.displayName = "Portal"

export { 
  Utility, 
  Divider, 
  Spacer, 
  Container, 
  Grid, 
  Flex, 
  Stack, 
  Center, 
  AspectRatio, 
  VisuallyHidden, 
  FocusTrap, 
  Portal, 
  utilityVariants 
} 