import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const formVariants = cva(
  "space-y-6",
  {
    variants: {
      variant: {
        default: "",
        card: "bg-card border border-border/50 rounded-lg p-6 shadow-sm",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6",
        outline: "border-2 border-dashed border-border/50 rounded-lg p-6",
      },
      size: {
        sm: "space-y-4",
        default: "space-y-6",
        lg: "space-y-8",
        xl: "space-y-10",
      },
      layout: {
        default: "",
        horizontal: "grid grid-cols-1 md:grid-cols-2 gap-6",
        vertical: "space-y-6",
        inline: "flex flex-wrap items-center gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "default",
    },
  }
)

const Form = React.forwardRef(({ className, variant, size, layout, children, ...props }, ref) => (
  <form ref={ref} className={cn(formVariants({ variant, size, layout, className }))} {...props}>
    {children}
  </form>
))
Form.displayName = "Form"

const FormGroup = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
))
FormGroup.displayName = "FormGroup"

const FormLabel = React.forwardRef(({ className, children, required = false, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium text-foreground", className)} {...props}>
    {children}
    {required && <span className="text-destructive ml-1">*</span>}
  </label>
))
FormLabel.displayName = "FormLabel"

const FormInput = React.forwardRef(({ 
  className, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  error, 
  ...props 
}, ref) => (
  <input
    ref={ref}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={cn(
      "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
      error ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-primary",
      className
    )}
    {...props}
  />
))
FormInput.displayName = "FormInput"

const FormTextarea = React.forwardRef(({ 
  className, 
  placeholder, 
  value, 
  onChange, 
  error, 
  rows = 4, 
  ...props 
}, ref) => (
  <textarea
    ref={ref}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
      error ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-primary",
      className
    )}
    {...props}
  />
))
FormTextarea.displayName = "FormTextarea"

const FormSelect = React.forwardRef(({ 
  className, 
  children, 
  value, 
  onChange, 
  error, 
  ...props 
}, ref) => (
  <select
    ref={ref}
    value={value}
    onChange={onChange}
    className={cn(
      "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
      error ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-primary",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
FormSelect.displayName = "FormSelect"

const FormOption = React.forwardRef(({ className, children, ...props }, ref) => (
  <option ref={ref} className={cn("", className)} {...props}>
    {children}
  </option>
))
FormOption.displayName = "FormOption"

const FormCheckbox = React.forwardRef(({ 
  className, 
  checked, 
  onChange, 
  error, 
  ...props 
}, ref) => (
  <input
    ref={ref}
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={cn(
      "h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
      error ? "border-destructive focus:ring-destructive" : "focus:ring-primary",
      className
    )}
    {...props}
  />
))
FormCheckbox.displayName = "FormCheckbox"

const FormRadio = React.forwardRef(({ 
  className, 
  checked, 
  onChange, 
  error, 
  ...props 
}, ref) => (
  <input
    ref={ref}
    type="radio"
    checked={checked}
    onChange={onChange}
    className={cn(
      "h-4 w-4 border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
      error ? "border-destructive focus:ring-destructive" : "focus:ring-primary",
      className
    )}
    {...props}
  />
))
FormRadio.displayName = "FormRadio"

const FormError = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-destructive", className)} {...props}>
    {children}
  </p>
))
FormError.displayName = "FormError"

const FormHelp = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
))
FormHelp.displayName = "FormHelp"

const FormActions = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-end space-x-4 pt-6", className)} {...props}>
    {children}
  </div>
))
FormActions.displayName = "FormActions"

export { 
  Form, 
  FormGroup, 
  FormLabel, 
  FormInput, 
  FormTextarea, 
  FormSelect, 
  FormOption, 
  FormCheckbox, 
  FormRadio, 
  FormError, 
  FormHelp, 
  FormActions, 
  formVariants 
} 