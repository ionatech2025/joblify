import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const chartVariants = cva(
  "w-full h-full",
  {
    variants: {
      variant: {
        default: "",
        line: "stroke-primary stroke-2",
        area: "fill-primary/20 stroke-primary stroke-2",
        bar: "fill-primary",
        pie: "stroke-primary stroke-2",
        donut: "stroke-primary stroke-2",
        radar: "stroke-primary stroke-2 fill-primary/10",
        scatter: "fill-primary",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg",
      },
      theme: {
        light: "text-gray-900",
        dark: "text-white",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      theme: "primary",
    },
  }
)

const Chart = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  theme, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(chartVariants({ variant, size, theme, className }))} 
    {...props}
  >
    {children}
  </div>
))
Chart.displayName = "Chart"

const LineChart = React.forwardRef(({ 
  className, 
  data, 
  width = 400, 
  height = 200, 
  children, 
  ...props 
}, ref) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((point.value - minValue) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <Chart 
      ref={ref} 
      variant="line" 
      className={cn("", className)} 
      {...props}
    >
      <svg width={width} height={height} className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width
          const y = height - ((point.value - minValue) / range) * height
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="hsl(var(--primary))"
              className="hover:r-6 transition-all duration-300"
            />
          )
        })}
      </svg>
      {children}
    </Chart>
  )
})
LineChart.displayName = "LineChart"

const AreaChart = React.forwardRef(({ 
  className, 
  data, 
  width = 400, 
  height = 200, 
  children, 
  ...props 
}, ref) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((point.value - minValue) / range) * height
    return `${x},${y}`
  }).join(' ')

  const areaPath = `${points} L${width},${height} L0,${height} Z`

  return (
    <Chart 
      ref={ref} 
      variant="area" 
      className={cn("", className)} 
      {...props}
    >
      <svg width={width} height={height} className="w-full h-full">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width
          const y = height - ((point.value - minValue) / range) * height
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="hsl(var(--primary))"
              className="hover:r-5 transition-all duration-300"
            />
          )
        })}
      </svg>
      {children}
    </Chart>
  )
})
AreaChart.displayName = "AreaChart"

const BarChart = React.forwardRef(({ 
  className, 
  data, 
  width = 400, 
  height = 200, 
  children, 
  ...props 
}, ref) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = width / data.length
  const barSpacing = barWidth * 0.1

  return (
    <Chart 
      ref={ref} 
      variant="bar" 
      className={cn("", className)} 
      {...props}
    >
      <svg width={width} height={height} className="w-full h-full">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {data.map((bar, index) => {
          const x = index * barWidth + barSpacing / 2
          const barHeight = (bar.value / maxValue) * height
          const y = height - barHeight
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth - barSpacing}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
                className="hover:opacity-80 transition-opacity duration-300"
              />
              <text
                x={x + (barWidth - barSpacing) / 2}
                y={y - 8}
                textAnchor="middle"
                className="text-xs font-medium fill-current"
              >
                {bar.value}
              </text>
            </g>
          )
        })}
      </svg>
      {children}
    </Chart>
  )
})
BarChart.displayName = "BarChart"

const PieChart = React.forwardRef(({ 
  className, 
  data, 
  size = 200, 
  children, 
  ...props 
}, ref) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90

  const createArc = (startAngle, endAngle, radius) => {
    const x1 = radius * Math.cos(startAngle * Math.PI / 180)
    const y1 = radius * Math.sin(startAngle * Math.PI / 180)
    const x2 = radius * Math.cos(endAngle * Math.PI / 180)
    const y2 = radius * Math.sin(endAngle * Math.PI / 180)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L 0 0 Z`
  }

  return (
    <Chart 
      ref={ref} 
      variant="pie" 
      className={cn("", className)} 
      {...props}
    >
      <svg width={size} height={size} className="w-full h-full">
        <defs>
          {data.map((item, index) => (
            <linearGradient key={index} id={`pieGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={item.color || `hsl(var(--primary))`} stopOpacity="0.8" />
              <stop offset="100%" stopColor={item.color || `hsl(var(--primary))`} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>
        <g transform={`translate(${size/2}, ${size/2})`}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            const radius = size / 3
            
            const path = createArc(startAngle, endAngle, radius)
            currentAngle = endAngle
            
            return (
              <g key={index}>
                <path
                  d={path}
                  fill={`url(#pieGradient${index})`}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity duration-300"
                />
                <text
                  x={radius * 0.7 * Math.cos((startAngle + angle/2) * Math.PI / 180)}
                  y={radius * 0.7 * Math.sin((startAngle + angle/2) * Math.PI / 180)}
                  textAnchor="middle"
                  className="text-xs font-medium fill-white"
                >
                  {item.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {children}
    </Chart>
  )
})
PieChart.displayName = "PieChart"

const DonutChart = React.forwardRef(({ 
  className, 
  data, 
  size = 200, 
  thickness = 40, 
  children, 
  ...props 
}, ref) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90
  const radius = size / 2
  const innerRadius = radius - thickness

  const createArc = (startAngle, endAngle, outerRadius, innerRadius) => {
    const x1 = outerRadius * Math.cos(startAngle * Math.PI / 180)
    const y1 = outerRadius * Math.sin(startAngle * Math.PI / 180)
    const x2 = outerRadius * Math.cos(endAngle * Math.PI / 180)
    const y2 = outerRadius * Math.sin(endAngle * Math.PI / 180)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${innerRadius * Math.cos(endAngle * Math.PI / 180)} ${innerRadius * Math.sin(endAngle * Math.PI / 180)} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerRadius * Math.cos(startAngle * Math.PI / 180)} ${innerRadius * Math.sin(startAngle * Math.PI / 180)} Z`
  }

  return (
    <Chart 
      ref={ref} 
      variant="donut" 
      className={cn("", className)} 
      {...props}
    >
      <svg width={size} height={size} className="w-full h-full">
        <defs>
          {data.map((item, index) => (
            <linearGradient key={index} id={`donutGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={item.color || `hsl(var(--primary))`} stopOpacity="0.8" />
              <stop offset="100%" stopColor={item.color || `hsl(var(--primary))`} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>
        <g transform={`translate(${size/2}, ${size/2})`}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            
            const path = createArc(startAngle, endAngle, radius, innerRadius)
            currentAngle = endAngle
            
            return (
              <g key={index}>
                <path
                  d={path}
                  fill={`url(#donutGradient${index})`}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity duration-300"
                />
              </g>
            )
          })}
          <circle
            cx="0"
            cy="0"
            r={innerRadius}
            fill="white"
            className="shadow-lg"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg font-bold fill-current"
          >
            {total}
          </text>
        </g>
      </svg>
      {children}
    </Chart>
  )
})
DonutChart.displayName = "DonutChart"

const ChartLegend = React.forwardRef(({ 
  className, 
  items, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-wrap gap-4 mt-4", className)} 
    {...props}
  >
    {items?.map((item, index) => (
      <div key={index} className="flex items-center space-x-2">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: item.color || 'hsl(var(--primary))' }}
        />
        <span className="text-sm text-muted-foreground">{item.label}</span>
      </div>
    ))}
    {children}
  </div>
))
ChartLegend.displayName = "ChartLegend"

const ChartTooltip = React.forwardRef(({ 
  className, 
  visible, 
  x, 
  y, 
  content, 
  children, 
  ...props 
}, ref) => {
  if (!visible) return null

  return (
    <div 
      ref={ref} 
      className={cn(
        "absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none",
        "transform -translate-x-1/2 -translate-y-full",
        className
      )} 
      style={{ left: x, top: y }}
      {...props}
    >
      {content}
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

export { 
  Chart, 
  LineChart, 
  AreaChart, 
  BarChart, 
  PieChart, 
  DonutChart, 
  ChartLegend, 
  ChartTooltip,
  chartVariants 
} 