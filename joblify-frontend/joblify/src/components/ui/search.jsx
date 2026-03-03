import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const searchVariants = cva(
  "relative transition-all duration-500",
  {
    variants: {
      variant: {
        default: "bg-white/95 backdrop-blur-sm border border-border/50 hover:border-border/80",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30",
        outline: "bg-transparent border-2 border-dashed border-border/50 hover:border-primary/50",
        filled: "bg-muted border border-border/50 hover:border-primary/50",
        minimal: "bg-transparent border-b border-border/50 hover:border-primary/50",
      },
      size: {
        sm: "p-2",
        default: "p-2",
        lg: "p-3",
        xl: "p-4",
      },
      shape: {
        default: "rounded-lg",
        rounded: "rounded-xl",
        full: "rounded-full",
        none: "rounded-none",
      },
      focus: {
        none: "",
        primary: "focus-within:border-primary/50 focus-within:shadow-primary/20",
        glow: "focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/25",
        ring: "focus-within:ring-2 focus-within:ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      focus: "primary",
    },
  }
)

const SearchContainer = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  shape, 
  focus, 
  children, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn(searchVariants({ variant, size, shape, focus, className }))} {...props}>
    {children}
  </div>
))
SearchContainer.displayName = "SearchContainer"

const SearchInput = React.forwardRef(({ 
  className, 
  placeholder = "Search...", 
  type = "text", 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  ...props 
}, ref) => (
  <input
    ref={ref}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={onBlur}
    className={cn(
      "w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none transition-all duration-300",
      className
    )}
    {...props}
  />
))
SearchInput.displayName = "SearchInput"

const SearchIcon = React.forwardRef(({ 
  className, 
  icon = "search", 
  size = "default", 
  ...props 
}, ref) => {
  const iconSize = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  }

  const icons = {
    search: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    location: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    filter: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
      </svg>
    ),
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors duration-300",
        iconSize[size],
        className
      )} 
      {...props}
    >
      {icons[icon] || icons.search}
    </div>
  )
})
SearchIcon.displayName = "SearchIcon"

const SearchClearButton = React.forwardRef(({ 
  className, 
  onClick, 
  size = "default", 
  ...props 
}, ref) => {
  const buttonSize = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200",
        buttonSize[size],
        className
      )}
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    </button>
  )
})
SearchClearButton.displayName = "SearchClearButton"

const SearchSuggestions = React.forwardRef(({ 
  className, 
  suggestions = [], 
  onSelect, 
  isVisible = false, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-lg z-50 transition-all duration-300",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
      className
    )} 
    {...props}
  >
    {suggestions.map((suggestion, index) => (
      <button
        key={index}
        onClick={() => onSelect(suggestion)}
        className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
      >
        {suggestion}
      </button>
    ))}
  </div>
))
SearchSuggestions.displayName = "SearchSuggestions"

const SearchPopular = React.forwardRef(({ 
  className, 
  terms = [], 
  onSelect, 
  ...props 
}, ref) => (
  <div ref={ref} className={cn("mt-4 pt-4 border-t border-border/20", className)} {...props}>
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span className="font-medium">Popular:</span>
      {terms.map((term, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(term)}
          className="px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-xs font-medium"
        >
          {term}
        </button>
      ))}
    </div>
  </div>
))
SearchPopular.displayName = "SearchPopular"

export { 
  SearchContainer, 
  SearchInput, 
  SearchIcon, 
  SearchClearButton, 
  SearchSuggestions, 
  SearchPopular, 
  searchVariants 
} 