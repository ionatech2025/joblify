import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:scale-105 hover:shadow-blue-500/25",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg hover:scale-105",
        outline: "border border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 shadow-sm hover:shadow-md hover:scale-105",
        secondary: "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-md hover:shadow-lg hover:scale-105",
        ghost: "hover:bg-blue-50 hover:text-blue-600 hover:scale-105",
        link: "text-blue-600 underline-offset-4 hover:underline hover:scale-105",
        // Enhanced variants
        gradient: "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 hover:shadow-blue-500/25",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105 shadow-lg hover:shadow-xl",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg hover:scale-105",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-lg hover:scale-105",
        info: "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        bounce: "animate-bounce",
        pulse: "animate-pulse",
        spin: "animate-spin",
        ping: "animate-ping",
        wiggle: "animate-wiggle",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, animation, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, animation, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }