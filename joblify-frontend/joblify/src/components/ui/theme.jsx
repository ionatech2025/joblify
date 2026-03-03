import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const themeVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        light: "bg-white text-gray-900",
        dark: "bg-gray-900 text-white",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent text-accent-foreground",
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
        gradient: "bg-gradient-to-br from-primary via-primary/90 to-primary/80",
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

const Theme = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(themeVariants({ variant, size, className }))} 
    {...props}
  >
    {children}
  </div>
))
Theme.displayName = "Theme"

const ThemeProvider = React.forwardRef(({ 
  className, 
  theme = "light", 
  children, 
  ...props 
}, ref) => {
  const themes = {
    light: "bg-white text-gray-900",
    dark: "bg-gray-900 text-white",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    gradient: "bg-gradient-to-br from-primary via-primary/90 to-primary/80",
  }

  return (
    <div 
      ref={ref} 
      className={cn("min-h-screen transition-colors duration-300", themes[theme], className)} 
      {...props}
    >
      {children}
    </div>
  )
})
ThemeProvider.displayName = "ThemeProvider"

const ThemeToggle = React.forwardRef(({ 
  className, 
  currentTheme = "light", 
  onToggle, 
  ...props 
}, ref) => {
  const themes = {
    light: "🌙",
    dark: "☀️",
    primary: "🎨",
    secondary: "🌈",
    muted: "⚫",
    accent: "✨",
    glass: "💎",
    gradient: "🎭",
  }

  const nextTheme = {
    light: "dark",
    dark: "primary",
    primary: "secondary",
    secondary: "muted",
    muted: "accent",
    accent: "glass",
    glass: "gradient",
    gradient: "light",
  }

  return (
    <button
      ref={ref}
      onClick={() => onToggle(nextTheme[currentTheme])}
      className={cn(
        "p-2 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:scale-110",
        className
      )}
      aria-label={`Switch to ${nextTheme[currentTheme]} theme`}
      {...props}
    >
      <span className="text-lg">{themes[currentTheme]}</span>
    </button>
  )
})
ThemeToggle.displayName = "ThemeToggle"

const ThemeSwitcher = React.forwardRef(({ 
  className, 
  currentTheme = "light", 
  onThemeChange, 
  themes = ["light", "dark", "primary", "secondary", "muted", "accent", "glass", "gradient"], 
  ...props 
}, ref) => {
  const themeIcons = {
    light: "☀️",
    dark: "🌙",
    primary: "🎨",
    secondary: "🌈",
    muted: "⚫",
    accent: "✨",
    glass: "💎",
    gradient: "🎭",
  }

  const themeNames = {
    light: "Light",
    dark: "Dark",
    primary: "Primary",
    secondary: "Secondary",
    muted: "Muted",
    accent: "Accent",
    glass: "Glass",
    gradient: "Gradient",
  }

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-2", className)} {...props}>
      {themes.map((theme) => (
        <button
          key={theme}
          onClick={() => onThemeChange(theme)}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105",
            currentTheme === theme
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted/50 hover:bg-muted text-foreground"
          )}
          aria-label={`Switch to ${themeNames[theme]} theme`}
        >
          <span className="text-lg">{themeIcons[theme]}</span>
          <span className="text-sm font-medium">{themeNames[theme]}</span>
        </button>
      ))}
    </div>
  )
})
ThemeSwitcher.displayName = "ThemeSwitcher"

const ThemePreview = React.forwardRef(({ 
  className, 
  theme = "light", 
  children, 
  ...props 
}, ref) => {
  const themeStyles = {
    light: "bg-white text-gray-900 border border-gray-200",
    dark: "bg-gray-900 text-white border border-gray-700",
    primary: "bg-primary text-primary-foreground border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-secondary/20",
    muted: "bg-muted text-muted-foreground border border-muted/20",
    accent: "bg-accent text-accent-foreground border border-accent/20",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white",
    gradient: "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white border border-primary/20",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "p-6 rounded-lg transition-all duration-300",
        themeStyles[theme],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
ThemePreview.displayName = "ThemePreview"

export { 
  Theme, 
  ThemeProvider, 
  ThemeToggle, 
  ThemeSwitcher, 
  ThemePreview, 
  themeVariants 
} 