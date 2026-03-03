import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const dashboardVariants = cva(
  "bg-background text-foreground",
  {
    variants: {
      variant: {
        default: "",
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
        gradient: "bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5",
        dark: "bg-gray-900 text-white",
        light: "bg-white text-gray-900",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-12",
      },
      layout: {
        grid: "grid gap-6",
        flex: "flex flex-col gap-6",
        masonry: "columns-1 md:columns-2 lg:columns-3 gap-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "grid",
    },
  }
)

const Dashboard = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  layout, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(dashboardVariants({ variant, size, layout, className }))} 
    {...props}
  >
    {children}
  </div>
))
Dashboard.displayName = "Dashboard"

const DashboardHeader = React.forwardRef(({ 
  className, 
  title, 
  subtitle, 
  actions, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", className)} 
    {...props}
  >
    <div className="flex-1">
      {title && (
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-muted-foreground text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
    {actions && (
      <div className="flex flex-wrap gap-3">
        {actions}
      </div>
    )}
  </div>
))
DashboardHeader.displayName = "DashboardHeader"

const DashboardCard = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  const cardVariants = {
    default: "bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300",
    elevated: "bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300",
    gradient: "bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300",
    outline: "bg-transparent border-2 border-border/50 hover:border-primary/50 transition-all duration-300",
    premium: "bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 border border-yellow-400/30 shadow-lg hover:shadow-xl transition-all duration-300",
  }

  const sizeClasses = {
    sm: "p-4 rounded-lg",
    default: "p-6 rounded-xl",
    lg: "p-8 rounded-2xl",
    xl: "p-12 rounded-3xl",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "group hover:scale-105 transition-all duration-500",
        cardVariants[variant],
        sizeClasses[size],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
DashboardCard.displayName = "DashboardCard"

const DashboardMetric = React.forwardRef(({ 
  className, 
  icon, 
  value, 
  label, 
  change, 
  trend = "up", 
  children, 
  ...props 
}, ref) => (
  <DashboardCard 
    ref={ref} 
    variant="elevated" 
    size="default" 
    className={cn("text-center group", className)} 
    {...props}
  >
    <div className="flex flex-col items-center space-y-4">
      {icon && (
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="text-3xl">{icon}</span>
        </div>
      )}
      <div className="space-y-2">
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          {value}
        </div>
        <div className="text-muted-foreground font-medium">{label}</div>
        {change && (
          <div className={`flex items-center justify-center space-x-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}>
            <span>{trend === "up" ? "↗" : "↘"}</span>
            <span>{change}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  </DashboardCard>
))
DashboardMetric.displayName = "DashboardMetric"

const DashboardChart = React.forwardRef(({ 
  className, 
  title, 
  subtitle, 
  children, 
  ...props 
}, ref) => (
  <DashboardCard 
    ref={ref} 
    variant="glass" 
    size="lg" 
    className={cn("", className)} 
    {...props}
  >
    <div className="mb-6">
      {title && (
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
      )}
      {subtitle && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
    <div className="min-h-[300px] flex items-center justify-center">
      {children}
    </div>
  </DashboardCard>
))
DashboardChart.displayName = "DashboardChart"

const DashboardTable = React.forwardRef(({ 
  className, 
  headers, 
  data, 
  children, 
  ...props 
}, ref) => (
  <DashboardCard 
    ref={ref} 
    variant="default" 
    size="default" 
    className={cn("overflow-hidden", className)} 
    {...props}
  >
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            {headers?.map((header, index) => (
              <th 
                key={index} 
                className="text-left py-4 px-6 font-semibold text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="border-b border-border/20 hover:bg-muted/30 transition-colors duration-200"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-4 px-6">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {children}
  </DashboardCard>
))
DashboardTable.displayName = "DashboardTable"

const DashboardWidget = React.forwardRef(({ 
  className, 
  title, 
  icon, 
  children, 
  ...props 
}, ref) => (
  <DashboardCard 
    ref={ref} 
    variant="outline" 
    size="default" 
    className={cn("", className)} 
    {...props}
  >
    <div className="flex items-center space-x-3 mb-4">
      {icon && (
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>
      )}
      {title && (
        <h4 className="text-lg font-semibold">{title}</h4>
      )}
    </div>
    {children}
  </DashboardCard>
))
DashboardWidget.displayName = "DashboardWidget"

const DashboardGrid = React.forwardRef(({ 
  className, 
  cols = 1, 
  gap = 6, 
  children, 
  ...props 
}, ref) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }

  const gridGaps = {
    2: "gap-2",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
    12: "gap-12",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "grid",
        gridCols[cols] || gridCols[3],
        gridGaps[gap] || gridGaps[6],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
})
DashboardGrid.displayName = "DashboardGrid"

const DashboardSidebar = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <aside 
    ref={ref} 
    className={cn("w-full lg:w-80 space-y-6", className)} 
    {...props}
  >
    {children}
  </aside>
))
DashboardSidebar.displayName = "DashboardSidebar"

const DashboardContent = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => (
  <main 
    ref={ref} 
    className={cn("flex-1 space-y-6", className)} 
    {...props}
  >
    {children}
  </main>
))
DashboardContent.displayName = "DashboardContent"

const DashboardLayout = React.forwardRef(({ 
  className, 
  sidebar, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col lg:flex-row gap-8", className)} 
    {...props}
  >
    {sidebar && (
      <DashboardSidebar>
        {sidebar}
      </DashboardSidebar>
    )}
    <DashboardContent>
      {children}
    </DashboardContent>
  </div>
))
DashboardLayout.displayName = "DashboardLayout"

const DashboardProgress = React.forwardRef(({ 
  className, 
  value, 
  max = 100, 
  label, 
  variant = "default", 
  size = "default", 
  ...props 
}, ref) => {
  const progressVariants = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  }

  const sizeClasses = {
    sm: "h-2",
    default: "h-3",
    lg: "h-4",
    xl: "h-6",
  }

  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{value}/{max}</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})
DashboardProgress.displayName = "DashboardProgress"

const DashboardStat = React.forwardRef(({ 
  className, 
  icon, 
  value, 
  label, 
  description, 
  trend, 
  children, 
  ...props 
}, ref) => (
  <DashboardCard 
    ref={ref} 
    variant="default" 
    size="default" 
    className={cn("group hover:scale-105 transition-all duration-500", className)} 
    {...props}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-3">
          {icon && (
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">{icon}</span>
            </div>
          )}
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-2 mt-3">
            <span className={`text-sm font-medium ${
              trend.value > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value > 0 ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.period}
            </span>
          </div>
        )}
      </div>
      {children}
    </div>
  </DashboardCard>
))
DashboardStat.displayName = "DashboardStat"

export { 
  Dashboard, 
  DashboardHeader, 
  DashboardCard, 
  DashboardMetric, 
  DashboardChart, 
  DashboardTable, 
  DashboardWidget, 
  DashboardGrid, 
  DashboardSidebar, 
  DashboardContent, 
  DashboardLayout, 
  DashboardProgress, 
  DashboardStat,
  dashboardVariants 
} 