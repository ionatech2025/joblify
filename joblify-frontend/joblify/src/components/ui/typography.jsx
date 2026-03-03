import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const typographyVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
        destructive: "text-destructive",
        success: "text-success",
        warning: "text-warning",
        info: "text-info",
        gradient: "bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
        "5xl": "text-5xl",
        "6xl": "text-6xl",
        "7xl": "text-7xl",
        "8xl": "text-8xl",
        "9xl": "text-9xl",
      },
      weight: {
        thin: "font-thin",
        extralight: "font-extralight",
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
        black: "font-black",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
      transform: {
        none: "",
        uppercase: "uppercase",
        lowercase: "lowercase",
        capitalize: "capitalize",
      },
      decoration: {
        none: "",
        underline: "underline",
        "line-through": "line-through",
        overline: "overline",
      },
      spacing: {
        tight: "tracking-tight",
        normal: "tracking-normal",
        wide: "tracking-wide",
        wider: "tracking-wider",
        widest: "tracking-widest",
      },
      leading: {
        none: "leading-none",
        tight: "leading-tight",
        snug: "leading-snug",
        normal: "leading-normal",
        relaxed: "leading-relaxed",
        loose: "leading-loose",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
      weight: "normal",
      align: "left",
      transform: "none",
      decoration: "none",
      spacing: "normal",
      leading: "normal",
    },
  }
)

const Typography = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <span 
    ref={ref} 
    className={cn(typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className }))} 
    {...props}
  >
    {children}
  </span>
))
Typography.displayName = "Typography"

const Heading = React.forwardRef(({ 
  className, 
  level = 1, 
  variant, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => {
  const sizeMap = {
    1: "text-4xl md:text-5xl lg:text-6xl",
    2: "text-3xl md:text-4xl lg:text-5xl",
    3: "text-2xl md:text-3xl lg:text-4xl",
    4: "text-xl md:text-2xl lg:text-3xl",
    5: "text-lg md:text-xl lg:text-2xl",
    6: "text-base md:text-lg lg:text-xl",
  }

  const Component = `h${level}`

  return (
    <Component 
      ref={ref} 
      className={cn(
        sizeMap[level],
        "font-bold leading-tight",
        typographyVariants({ variant, weight, align, transform, decoration, spacing, leading, className })
      )} 
      {...props}
    >
      {children}
    </Component>
  )
})
Heading.displayName = "Heading"

const Title = React.forwardRef(({ 
  className, 
  variant, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <h1 
    ref={ref} 
    className={cn(
      "text-3xl md:text-4xl lg:text-5xl font-bold leading-tight",
      typographyVariants({ variant, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </h1>
))
Title.displayName = "Title"

const Subtitle = React.forwardRef(({ 
  className, 
  variant, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <h2 
    ref={ref} 
    className={cn(
      "text-xl md:text-2xl lg:text-3xl font-semibold leading-tight",
      typographyVariants({ variant, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </h2>
))
Subtitle.displayName = "Subtitle"

const Paragraph = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <p 
    ref={ref} 
    className={cn(
      "leading-relaxed",
      typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </p>
))
Paragraph.displayName = "Paragraph"

const Text = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <span 
    ref={ref} 
    className={cn(
      typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </span>
))
Text.displayName = "Text"

const Caption = React.forwardRef(({ 
  className, 
  variant, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <span 
    ref={ref} 
    className={cn(
      "text-xs",
      typographyVariants({ variant, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </span>
))
Caption.displayName = "Caption"

const Blockquote = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <blockquote 
    ref={ref} 
    className={cn(
      "border-l-4 border-primary/20 pl-4 italic",
      typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </blockquote>
))
Blockquote.displayName = "Blockquote"

const Code = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <code 
    ref={ref} 
    className={cn(
      "bg-muted px-2 py-1 rounded text-sm font-mono",
      typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </code>
))
Code.displayName = "Code"

const Pre = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  weight, 
  align, 
  transform, 
  decoration, 
  spacing, 
  leading, 
  children, 
  ...props 
}, ref) => (
  <pre 
    ref={ref} 
    className={cn(
      "bg-muted p-4 rounded-lg overflow-x-auto",
      typographyVariants({ variant, size, weight, align, transform, decoration, spacing, leading, className })
    )} 
    {...props}
  >
    {children}
  </pre>
))
Pre.displayName = "Pre"

export { 
  Typography, 
  Heading, 
  Title, 
  Subtitle, 
  Paragraph, 
  Text, 
  Caption, 
  Blockquote, 
  Code, 
  Pre, 
  typographyVariants 
} 