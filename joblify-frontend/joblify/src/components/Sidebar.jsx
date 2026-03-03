import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "./ui/button"
import { 
  Menu, 
  X, 
  Home, 
  Building2, 
  Briefcase, 
  Bell, 
  User, 
  FileText, 
  Bookmark, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageCircle,
  Search,
  Calendar,
  BarChart3,
  Globe,
  Mail,
  Phone,
  MapPin,
  Award,
  GraduationCap
} from "lucide-react"

export function Sidebar({ userType = "COMPANY", onLogout, onOpenProfile, onOpenVIChat, onOpenApplicants }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Company navigation items
  const companyNavItems = [
    {
      to: "/",
      label: "Home",
      icon: Home,
      description: "..."
    },
    {
      to: "/company/profile",
      label: "Company Profile",
      icon: Building2,
       description: "..."
    },
    {
      to: "/my-job-posts",
      label: "My Job Posts",
      icon: Briefcase,
     description: "..."
    },
    {
      to: "/jobseekers",
      label: "Browse Jobseekers",
      icon: Users,
      description: "..."
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
     description: "..."
    },
    {
      to: "/company/applicants",
      label: "View Applicants",
      icon: FileText,
      description: "..."
    },
    {
      to: "/company/vi-chat",
      label: "VI Chat Areas",
      icon: MessageCircle,
      description: "..."
    }
  ]

  // Jobseeker navigation items
  const jobseekerNavItems = [
    {
      to: "/",
      label: "Home",
      icon: Home,
      description: "***"
    },
    {
      to: "/profile",
      label: "My Profile",
      icon: User,
      description: "***"
    },
    {
      to: "/jobs",
      label: "Browse Jobs",
      icon: Search,
        description: "***"
    },
    {
      to: "/companies",
      label: "Browse Companies",
      icon: Building2,
        description: "***"
    },
    {
      to: "/my-applications",
      label: "My Applications",
      icon: FileText,
       description: "***"
    },
    {
      to: "/invitations",
      label: "Invitations",
      icon: Mail,
        description: "***"
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
       description: "***"
    }
  ]

  const navItems = userType === "COMPANY" ? companyNavItems : jobseekerNavItems

  const isActiveRoute = (path) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-700 border-r border-blue-500/50 shadow-lg z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500/50">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="font-bold text-lg text-white">Joblify</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="hidden lg:flex h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              
              // Special handling for "My Profile" button when onOpenProfile is provided
              if (item.label === "My Profile" && onOpenProfile && userType === "JOB_SEEKER") {
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      onOpenProfile()
                      // Close mobile sidebar when profile modal is opened
                      if (window.innerWidth < 1024) {
                        setIsOpen(false)
                      }
                    }}
                    className={`
                      flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                      hover:bg-white/10 hover:text-white group w-full text-left
                      ${isActiveRoute(item.to) 
                        ? 'bg-white/20 text-white border-r-2 border-white' 
                        : 'text-blue-100 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.description : undefined}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActiveRoute(item.to) ? 'text-white' : 'text-blue-200'}`} />
                    {!isCollapsed && (
                                              <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{item.label}</span>
                          {!isCollapsed && (
                            <p className="text-xs text-blue-200/80 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  )
                }
                
                // Special handling for "VI Chat Areas" button when onOpenVIChat is provided
                if (item.label === "VI Chat Areas" && onOpenVIChat && userType === "COMPANY") {
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        onOpenVIChat()
                        // Close mobile sidebar when VI Chat modal is opened
                        if (window.innerWidth < 1024) {
                          setIsOpen(false)
                        }
                      }}
                      className={`
                        flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                        hover:bg-white/10 hover:text-white group w-full text-left
                        ${isActiveRoute(item.to) 
                          ? 'bg-white/20 text-white border-r-2 border-white' 
                          : 'text-blue-200 hover:text-white'
                        }
                      `}
                      title={isCollapsed ? item.description : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActiveRoute(item.to) ? 'text-white' : 'text-blue-200'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{item.label}</span>
                          {!isCollapsed && (
                            <p className="text-xs text-blue-200/80 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  )
                }
                
                // Special handling for "View Applicants" button when onOpenApplicants is provided
                if (item.label === "View Applicants" && onOpenApplicants && userType === "COMPANY") {
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        onOpenApplicants()
                        // Close mobile sidebar when applicants modal is opened
                        if (window.innerWidth < 1024) {
                          setIsOpen(false)
                        }
                      }}
                      className={`
                        flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                        hover:bg-white/10 hover:text-white group w-full text-left
                        ${isActiveRoute(item.to) 
                          ? 'bg-white/20 text-white border-r-2 border-white' 
                          : 'text-blue-200 hover:text-white'
                        }
                      `}
                      title={isCollapsed ? item.description : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActiveRoute(item.to) ? 'text-white' : 'text-blue-200'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{item.label}</span>
                          {!isCollapsed && (
                            <p className="text-xs text-blue-200/80 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  )
                }
              
              // Default Link rendering for other items
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                    hover:bg-white/10 hover:text-white group
                    ${isActiveRoute(item.to) 
                      ? 'bg-white/20 text-white border-r-2 border-white' 
                        : 'text-blue-100 hover:text-white'
                    }
                  `}
                  title={isCollapsed ? item.description : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActiveRoute(item.to) ? 'text-white' : 'text-blue-200'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{item.label}</span>
                      {!isCollapsed && (
                        <p className="text-xs text-blue-200/80 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-blue-500/50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className={`
              w-full justify-start transition-all duration-200
              border-white/30 text-white hover:bg-white/10 hover:border-white/50
              ${isCollapsed ? 'px-2' : 'px-3'}
            `}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 p-0 bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  )
} 