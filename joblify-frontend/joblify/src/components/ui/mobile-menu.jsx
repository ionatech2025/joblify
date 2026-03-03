import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const mobileMenuVariants = cva(
  "transition-all duration-300 ease-in-out overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-background border-t border-border/20",
        glass: "bg-white/10 backdrop-blur-md border-t border-white/20",
        dark: "bg-gray-900 border-t border-gray-700",
        light: "bg-white border-t border-gray-200",
      },
      size: {
        sm: "max-h-64",
        default: "max-h-96",
        lg: "max-h-[32rem]",
        xl: "max-h-[40rem]",
      },
      animation: {
        none: "",
        slide: "animate-slide-up",
        fade: "animate-fade-in",
        scale: "animate-bounce-in",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const MobileMenu = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  animation, 
  isOpen, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(
      mobileMenuVariants({ variant, size, animation, className }),
      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
    )} 
    {...props}
  >
    <div className="py-6">
      {children}
    </div>
  </div>
))
MobileMenu.displayName = "MobileMenu"

const MobileMenuHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-2 border-b border-border/20", className)} {...props}>
    {children}
  </div>
))
MobileMenuHeader.displayName = "MobileMenuHeader"

const MobileMenuTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props}>
    {children}
  </h3>
))
MobileMenuTitle.displayName = "MobileMenuTitle"

const MobileMenuContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("px-4", className)} {...props}>
    {children}
  </div>
))
MobileMenuContent.displayName = "MobileMenuContent"

const MobileMenuItem = React.forwardRef(({ 
  className, 
  href, 
  children, 
  icon, 
  isActive = false, 
  onClick, 
  ...props 
}, ref) => (
  <a
    ref={ref}
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary",
      isActive ? "text-primary bg-primary/10" : "text-foreground",
      className
    )}
    {...props}
  >
    {icon && <span className="text-lg">{icon}</span>}
    <span className="font-medium">{children}</span>
  </a>
))
MobileMenuItem.displayName = "MobileMenuItem"

const MobileMenuButton = React.forwardRef(({ 
  className, 
  children, 
  variant = "default",
  size = "default",
  onClick, 
  ...props 
}, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300",
      variant === "default" && "bg-primary text-white hover:bg-primary/90",
      variant === "outline" && "border border-border/50 text-foreground hover:border-primary/50 hover:bg-primary/5",
      variant === "ghost" && "text-foreground hover:bg-primary/10",
      size === "sm" && "py-2 text-sm",
      size === "default" && "py-3 text-base",
      size === "lg" && "py-4 text-lg",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
MobileMenuButton.displayName = "MobileMenuButton"

const MobileMenuGroup = React.forwardRef(({ className, title, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {title && (
      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
    )}
    {children}
  </div>
))
MobileMenuGroup.displayName = "MobileMenuGroup"

const MobileMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("h-px bg-border/20 my-2", className)} {...props} />
))
MobileMenuSeparator.displayName = "MobileMenuSeparator"

const MobileMenuToggle = React.forwardRef(({ 
  className, 
  isOpen, 
  onClick, 
  variant = "default",
  size = "default",
  ...props 
}, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    aria-label="Toggle mobile menu"
    className={cn(
      "transition-all duration-300 hover:scale-110",
      variant === "default" && "text-foreground hover:text-primary",
      variant === "white" && "text-white hover:text-white/80",
      size === "sm" && "p-2",
      size === "default" && "p-2",
      size === "lg" && "p-3",
      className
    )}
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "h-6 w-6 transition-transform duration-300",
        isOpen ? "rotate-90" : ""
      )}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  </button>
))
MobileMenuToggle.displayName = "MobileMenuToggle"

export { 
  MobileMenu, 
  MobileMenuHeader, 
  MobileMenuTitle, 
  MobileMenuContent, 
  MobileMenuItem, 
  MobileMenuButton, 
  MobileMenuGroup, 
  MobileMenuSeparator, 
  MobileMenuToggle, 
  mobileMenuVariants 
} 