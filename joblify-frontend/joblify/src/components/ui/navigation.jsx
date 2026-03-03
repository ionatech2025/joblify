import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const navigationVariants = cva(
  "flex items-center space-x-6",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        white: "text-white",
      },
      size: {
        sm: "space-x-4",
        default: "space-x-6",
        lg: "space-x-8",
        xl: "space-x-10",
      },
      layout: {
        horizontal: "flex-row",
        vertical: "flex-col space-x-0 space-y-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "horizontal",
    },
  }
)

const Navigation = React.forwardRef(({ className, variant, size, layout, children, ...props }, ref) => (
  <nav ref={ref} className={cn(navigationVariants({ variant, size, layout, className }))} {...props}>
    {children}
  </nav>
))
Navigation.displayName = "Navigation"

const NavigationItem = React.forwardRef(({ 
  className, 
  href, 
  children, 
  icon, 
  isActive = false, 
  ...props 
}, ref) => (
  <a
    ref={ref}
    href={href}
    className={cn(
      "group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10",
      isActive ? "text-primary bg-primary/10" : "text-foreground hover:text-primary",
      className
    )}
    {...props}
  >
    {icon && <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{icon}</span>}
    <span className="font-medium">{children}</span>
  </a>
))
NavigationItem.displayName = "NavigationItem"

const NavigationDropdown = React.forwardRef(({ 
  className, 
  label, 
  icon, 
  children, 
  isOpen = false, 
  onToggle, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    <button
      onClick={onToggle}
      className={cn(
        "group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 text-foreground hover:text-primary",
        isOpen && "text-primary bg-primary/10"
      )}
    >
      <span className="font-medium">{label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "transition-transform duration-300",
          isOpen ? "rotate-180" : ""
        )}
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>
    
    {isOpen && (
      <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border/50 rounded-lg shadow-lg py-2 z-50">
        {children}
      </div>
    )}
  </div>
))
NavigationDropdown.displayName = "NavigationDropdown"

const NavigationDropdownItem = React.forwardRef(({ 
  className, 
  href, 
  children, 
  icon, 
  isActive = false, 
  ...props 
}, ref) => (
  <a
    ref={ref}
    href={href}
    className={cn(
      "flex items-center space-x-3 px-4 py-2 text-sm transition-colors duration-200 hover:bg-primary/10",
      isActive ? "text-primary bg-primary/10" : "text-foreground hover:text-primary",
      className
    )}
    {...props}
  >
    {icon && <span className="text-base">{icon}</span>}
    <span>{children}</span>
  </a>
))
NavigationDropdownItem.displayName = "NavigationDropdownItem"

const NavigationGroup = React.forwardRef(({ className, title, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {title && (
      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
    )}
    {children}
  </div>
))
NavigationGroup.displayName = "NavigationGroup"

const NavigationSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("h-px bg-border/50 my-2", className)} {...props} />
))
NavigationSeparator.displayName = "NavigationSeparator"

export { 
  Navigation, 
  NavigationItem, 
  NavigationDropdown, 
  NavigationDropdownItem, 
  NavigationGroup, 
  NavigationSeparator, 
  navigationVariants 
} 