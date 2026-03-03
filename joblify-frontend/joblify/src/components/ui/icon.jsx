import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const iconVariants = cva(
  "inline-block",
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
        white: "text-white",
        black: "text-black",
      },
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        base: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
        "2xl": "w-10 h-10",
        "3xl": "w-12 h-12",
        "4xl": "w-16 h-16",
        "5xl": "w-20 h-20",
        "6xl": "w-24 h-24",
      },
      animation: {
        none: "",
        spin: "animate-spin",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
        wiggle: "animate-wiggle",
        shake: "animate-shake",
        float: "animate-float",
        glow: "animate-glow",
        shimmer: "animate-shimmer",
        heartbeat: "animate-heartbeat",
        rubberBand: "animate-rubber-band",
        swing: "animate-swing",
        tada: "animate-tada",
        wobble: "animate-wobble",
        hinge: "animate-hinge",
        rollIn: "animate-roll-in",
        rollOut: "animate-roll-out",
        lightSpeedIn: "animate-light-speed-in",
        lightSpeedOut: "animate-light-speed-out",
        flipInX: "animate-flip-in-x",
        flipInY: "animate-flip-in-y",
        flipOutX: "animate-flip-out-x",
        flipOutY: "animate-flip-out-y",
        bounceIn: "animate-bounce-in",
        bounceOut: "animate-bounce-out",
        fadeIn: "animate-fade-in",
        fadeOut: "animate-fade-out",
        slideInUp: "animate-slide-in-up",
        slideInDown: "animate-slide-in-down",
        slideInLeft: "animate-slide-in-left",
        slideInRight: "animate-slide-in-right",
        slideOutUp: "animate-slide-out-up",
        slideOutDown: "animate-slide-out-down",
        slideOutLeft: "animate-slide-out-left",
        slideOutRight: "animate-slide-out-right",
        zoomIn: "animate-zoom-in",
        zoomOut: "animate-zoom-out",
        rotateIn: "animate-rotate-in",
        rotateOut: "animate-rotate-out",
        hingeIn: "animate-hinge-in",
        hingeOut: "animate-hinge-out",
        jackInTheBox: "animate-jack-in-the-box",
        rollIn: "animate-roll-in",
        rollOut: "animate-roll-out",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
      animation: "none",
    },
  }
)

const Icon = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  animation, 
  children, 
  ...props 
}, ref) => (
  <span 
    ref={ref} 
    className={cn(iconVariants({ variant, size, animation, className }))} 
    {...props}
  >
    {children}
  </span>
))
Icon.displayName = "Icon"

// Predefined icon components
const SearchIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  </Icon>
))
SearchIcon.displayName = "SearchIcon"

const LocationIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </Icon>
))
LocationIcon.displayName = "LocationIcon"

const ClockIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  </Icon>
))
ClockIcon.displayName = "ClockIcon"

const CalendarIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  </Icon>
))
CalendarIcon.displayName = "CalendarIcon"

const EyeIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </Icon>
))
EyeIcon.displayName = "EyeIcon"

const CheckIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </Icon>
))
CheckIcon.displayName = "CheckIcon"

const XIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  </Icon>
))
XIcon.displayName = "XIcon"

const PlusIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  </Icon>
))
PlusIcon.displayName = "PlusIcon"

const MinusIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  </Icon>
))
MinusIcon.displayName = "MinusIcon"

const ChevronDownIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </Icon>
))
ChevronDownIcon.displayName = "ChevronDownIcon"

const ChevronUpIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  </Icon>
))
ChevronUpIcon.displayName = "ChevronUpIcon"

const ChevronLeftIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  </Icon>
))
ChevronLeftIcon.displayName = "ChevronLeftIcon"

const ChevronRightIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  </Icon>
))
ChevronRightIcon.displayName = "ChevronRightIcon"

const ArrowRightIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  </Icon>
))
ArrowRightIcon.displayName = "ArrowRightIcon"

const ArrowLeftIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  </Icon>
))
ArrowLeftIcon.displayName = "ArrowLeftIcon"

const StarIcon = React.forwardRef(({ className, filled = false, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  </Icon>
))
StarIcon.displayName = "StarIcon"

const HeartIcon = React.forwardRef(({ className, filled = false, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  </Icon>
))
HeartIcon.displayName = "HeartIcon"

const UserIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </Icon>
))
UserIcon.displayName = "UserIcon"

const SettingsIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </Icon>
))
SettingsIcon.displayName = "SettingsIcon"

const MenuIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  </Icon>
))
MenuIcon.displayName = "MenuIcon"

const CloseIcon = React.forwardRef(({ className, ...props }, ref) => (
  <Icon ref={ref} className={className} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </Icon>
))
CloseIcon.displayName = "CloseIcon"

export { 
  Icon, 
  SearchIcon, 
  LocationIcon, 
  ClockIcon, 
  CalendarIcon, 
  EyeIcon, 
  CheckIcon, 
  XIcon, 
  PlusIcon, 
  MinusIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon, 
  StarIcon, 
  HeartIcon, 
  UserIcon, 
  SettingsIcon, 
  MenuIcon, 
  CloseIcon, 
  iconVariants 
} 