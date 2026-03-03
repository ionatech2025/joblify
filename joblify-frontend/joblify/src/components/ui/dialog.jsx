import React from "react"

export function Dialog({ children, open, onOpenChange }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full max-w-md mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-xl border border-border/50 ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = "" }) {
  return (
    <div className={`p-6 border-b border-border/50 ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = "" }) {
  return (
    <h2 className={`text-xl font-semibold ${className}`}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children, className = "" }) {
  return (
    <p className={`text-muted-foreground mt-2 ${className}`}>
      {children}
    </p>
  )
}

export function DialogFooter({ children, className = "" }) {
  return (
    <div className={`p-6 border-t border-border/50 flex justify-end space-x-2 ${className}`}>
      {children}
    </div>
  )
} 