import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const calendarVariants = cva(
  "bg-background text-foreground",
  {
    variants: {
      variant: {
        default: "border border-border/50 rounded-lg",
        elevated: "border border-border/50 rounded-lg shadow-lg",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 rounded-lg",
        outline: "border-2 border-border/50 rounded-lg",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      theme: {
        light: "bg-white text-gray-900",
        dark: "bg-gray-900 text-white",
        primary: "bg-primary/5 text-primary-foreground",
        secondary: "bg-secondary/5 text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      theme: "light",
    },
  }
)

const Calendar = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  theme, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(calendarVariants({ variant, size, theme, className }))} 
    {...props}
  >
    {children}
  </div>
))
Calendar.displayName = "Calendar"

const CalendarHeader = React.forwardRef(({ 
  className, 
  currentMonth, 
  onPreviousMonth, 
  onNextMonth, 
  onToday, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("flex items-center justify-between mb-4", className)} 
    {...props}
  >
    <div className="flex items-center space-x-2">
      <button
        onClick={onPreviousMonth}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200 hover:scale-105"
        aria-label="Previous month"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>
      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200 hover:scale-105"
        aria-label="Next month"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </button>
    </div>
    
    <div className="flex items-center space-x-4">
      <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </h2>
      <button
        onClick={onToday}
        className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors duration-200"
      >
        Today
      </button>
    </div>
    
    {children}
  </div>
))
CalendarHeader.displayName = "CalendarHeader"

const CalendarWeekdays = React.forwardRef(({ 
  className, 
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("grid grid-cols-7 gap-1 mb-2", className)} 
    {...props}
  >
    {weekdays.map((day, index) => (
      <div
        key={index}
        className="p-2 text-center text-sm font-semibold text-muted-foreground"
      >
        {day}
      </div>
    ))}
    {children}
  </div>
))
CalendarWeekdays.displayName = "CalendarWeekdays"

const CalendarDays = React.forwardRef(({ 
  className, 
  days, 
  selectedDate, 
  onDateSelect, 
  currentMonth, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn("grid grid-cols-7 gap-1", className)} 
    {...props}
  >
    {days.map((day, index) => {
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
      const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString()
      const isToday = day.toDateString() === new Date().toDateString()
      
      return (
        <button
          key={index}
          onClick={() => onDateSelect(day)}
          className={cn(
            "p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            isCurrentMonth
              ? isSelected
                ? "bg-primary text-primary-foreground shadow-lg"
                : isToday
                ? "bg-primary/20 text-primary border-2 border-primary"
                : "hover:bg-muted/50"
              : "text-muted-foreground/50",
            isSelected && "ring-2 ring-primary/30"
          )}
          disabled={!isCurrentMonth}
        >
          {day.getDate()}
        </button>
      )
    })}
    {children}
  </div>
))
CalendarDays.displayName = "CalendarDays"

const CalendarEvent = React.forwardRef(({ 
  className, 
  event, 
  onClick, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    onClick={() => onClick?.(event)}
    className={cn(
      "p-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105",
      "bg-primary/10 text-primary border border-primary/20",
      "hover:bg-primary/20 hover:border-primary/30",
      className
    )} 
    {...props}
  >
    <div className="font-semibold">{event.title}</div>
    {event.time && (
      <div className="text-primary/70">{event.time}</div>
    )}
    {children}
  </div>
))
CalendarEvent.displayName = "CalendarEvent"

const CalendarMonth = React.forwardRef(({ 
  className, 
  month, 
  year, 
  selectedDate, 
  onDateSelect, 
  events = [], 
  children, 
  ...props 
}, ref) => {
  const [currentDate, setCurrentDate] = React.useState(new Date(year, month))
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, lastDay.getDate() - i))
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }
  
  const days = getDaysInMonth(currentDate)
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
    onDateSelect?.(new Date())
  }
  
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  return (
    <Calendar 
      ref={ref} 
      variant="elevated" 
      size="lg" 
      className={cn("", className)} 
      {...props}
    >
      <CalendarHeader
        currentMonth={currentDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />
      
      <CalendarWeekdays />
      
      <CalendarDays
        days={days}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        currentMonth={currentDate}
      />
      
      {/* Events Display */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            Events for {selectedDate.toLocaleDateString()}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map((event, index) => (
              <CalendarEvent
                key={index}
                event={event}
                onClick={(e) => console.log('Event clicked:', e)}
              />
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-muted-foreground text-sm">No events scheduled for this date.</p>
            )}
          </div>
        </div>
      )}
      
      {children}
    </Calendar>
  )
})
CalendarMonth.displayName = "CalendarMonth"

const CalendarMini = React.forwardRef(({ 
  className, 
  date = new Date(), 
  onDateSelect, 
  children, 
  ...props 
}, ref) => {
  const [currentDate, setCurrentDate] = React.useState(date)
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, lastDay.getDate() - i))
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }
  
  const days = getDaysInMonth(currentDate)
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <Calendar 
      ref={ref} 
      variant="default" 
      size="sm" 
      className={cn("w-80", className)} 
      {...props}
    >
      <CalendarHeader
        currentMonth={currentDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
      />
      
      <CalendarWeekdays />
      
      <CalendarDays
        days={days}
        selectedDate={date}
        onDateSelect={onDateSelect}
        currentMonth={currentDate}
      />
      
      {children}
    </Calendar>
  )
})
CalendarMini.displayName = "CalendarMini"

const CalendarRange = React.forwardRef(({ 
  className, 
  startDate, 
  endDate, 
  onRangeChange, 
  children, 
  ...props 
}, ref) => {
  const [range, setRange] = React.useState({
    start: startDate || null,
    end: endDate || null
  })
  
  const handleDateSelect = (date) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: null })
      onRangeChange?.({ start: date, end: null })
    } else {
      const newEnd = date > range.start ? date : range.start
      const newStart = date > range.start ? range.start : date
      setRange({ start: newStart, end: newEnd })
      onRangeChange?.({ start: newStart, end: newEnd })
    }
  }
  
  const isInRange = (date) => {
    if (!range.start || !range.end) return false
    return date >= range.start && date <= range.end
  }
  
  const isRangeStart = (date) => {
    return range.start && date.toDateString() === range.start.toDateString()
  }
  
  const isRangeEnd = (date) => {
    return range.end && date.toDateString() === range.end.toDateString()
  }

  return (
    <Calendar 
      ref={ref} 
      variant="elevated" 
      size="lg" 
      className={cn("", className)} 
      {...props}
    >
      <div className="mb-4 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="text-muted-foreground">Start:</span>
            <span className="ml-2 font-medium">
              {range.start ? range.start.toLocaleDateString() : 'Not selected'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">End:</span>
            <span className="ml-2 font-medium">
              {range.end ? range.end.toLocaleDateString() : 'Not selected'}
            </span>
          </div>
        </div>
      </div>
      
      <CalendarMonth
        month={new Date().getMonth()}
        year={new Date().getFullYear()}
        selectedDate={range.start}
        onDateSelect={handleDateSelect}
      />
      
      {children}
    </Calendar>
  )
})
CalendarRange.displayName = "CalendarRange"

export { 
  Calendar, 
  CalendarHeader, 
  CalendarWeekdays, 
  CalendarDays, 
  CalendarEvent, 
  CalendarMonth, 
  CalendarMini, 
  CalendarRange,
  calendarVariants 
} 