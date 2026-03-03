import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        white: "text-white",
      },
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
      },
      animation: {
        spin: "animate-spin",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "spin",
    },
  }
)

const LoadingSpinner = React.forwardRef(({ className, variant, size, animation, ...props }, ref) => (
  <div ref={ref} className={cn(loadingVariants({ variant, size, animation, className }))} {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="w-full h-full"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
))
LoadingSpinner.displayName = "LoadingSpinner"

const LoadingDots = React.forwardRef(({ className, variant, size, animation, ...props }, ref) => (
  <div ref={ref} className={cn("flex space-x-1", className)} {...props}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          "rounded-full bg-current",
          size === "sm" && "w-1.5 h-1.5",
          size === "default" && "w-2 h-2",
          size === "lg" && "w-2.5 h-2.5",
          size === "xl" && "w-3 h-3",
          variant === "default" && "text-primary",
          variant === "secondary" && "text-secondary-foreground",
          variant === "muted" && "text-muted-foreground",
          variant === "white" && "text-white",
          "animate-pulse"
        )}
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
))
LoadingDots.displayName = "LoadingDots"

const LoadingBar = React.forwardRef(({ className, variant, size, animation, ...props }, ref) => (
  <div ref={ref} className={cn("w-full bg-muted rounded-full overflow-hidden", className)} {...props}>
    <div
      className={cn(
        "h-full rounded-full transition-all duration-1000 ease-out",
        size === "sm" && "h-1",
        size === "default" && "h-2",
        size === "lg" && "h-3",
        size === "xl" && "h-4",
        variant === "default" && "bg-primary",
        variant === "secondary" && "bg-secondary-foreground",
        variant === "muted" && "bg-muted-foreground",
        variant === "white" && "bg-white",
        "animate-pulse"
      )}
      style={{
        width: "100%",
        animation: "loading-bar 2s ease-in-out infinite",
      }}
    />
  </div>
))
LoadingBar.displayName = "LoadingBar"

const LoadingSkeleton = React.forwardRef(({ className, variant, size, animation, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "animate-pulse rounded-md bg-muted",
      size === "sm" && "h-4",
      size === "default" && "h-6",
      size === "lg" && "h-8",
      size === "xl" && "h-12",
      className
    )}
    {...props}
  />
))
LoadingSkeleton.displayName = "LoadingSkeleton"

export { LoadingSpinner, LoadingDots, LoadingBar, LoadingSkeleton, loadingVariants } 