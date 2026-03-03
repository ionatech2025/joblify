import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Clock, 
  MessageCircle,
  Building2,
  Briefcase,
  Users,
  ExternalLink,
  Filter,
  Search,
  Trash2,
  Archive,
  Settings,
  Eye,
  EyeOff,
  Star,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  Linkedin,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [showSettings, setShowSettings] = useState(false)

  // Mock current user data
  const mockCurrentUser = {
    id: "js_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    role: "JOB_SEEKER",
    avatar: "https://example.com/avatar1.jpg"
  }

  // Mock notifications data
  const mockNotifications = [
    {
      id: "notif_001",
      type: "JOB_SHARED",
      title: "Job Post Shared",
      message: "TechCorp Solutions shared a job post with you: Senior React Developer",
      jobPost: {
        id: "job_001",
        title: "Senior React Developer",
        company: "TechCorp Solutions",
        location: "San Francisco, CA",
        type: "Full-time",
        salary: "$120k - $180k"
      },
      sender: {
        id: "comp_001",
        name: "TechCorp Solutions",
        logo: "https://example.com/logo.png"
      },
      timestamp: "2024-01-15T10:30:00Z",
      isRead: false,
      priority: "high"
    },
    {
      id: "notif_002",
      type: "CHAT_INVITATION",
      title: "Added to Chat Room",
      message: "You've been added to TechCorp Solutions' chat for Frontend Developer position",
      chat: {
        id: "chat_001",
        name: "Frontend Developer Chat",
        jobTitle: "Frontend Developer",
        company: "TechCorp Solutions"
      },
      sender: {
        id: "comp_001",
        name: "TechCorp Solutions",
        logo: "https://example.com/logo.png"
      },
      timestamp: "2024-01-14T16:45:00Z",
      isRead: true,
      priority: "medium"
    },
    {
      id: "notif_003",
      type: "VI_CHAT_INVITATION",
      title: "Virtual Intern Chat Invitation",
      message: "You've been invited to join TechCorp Solutions' Virtual Intern program chat",
      chat: {
        id: "chat_002",
        name: "Virtual Intern Program",
        company: "TechCorp Solutions"
      },
      sender: {
        id: "comp_001",
        name: "TechCorp Solutions",
        logo: "https://example.com/logo.png"
      },
      timestamp: "2024-01-13T14:20:00Z",
      isRead: false,
      priority: "high"
    },
    {
      id: "notif_004",
      type: "APPLICATION_UPDATE",
      title: "Application Status Updated",
      message: "Your application for Senior Developer at TechCorp Solutions has been reviewed",
      application: {
        id: "app_001",
        jobTitle: "Senior Developer",
        company: "TechCorp Solutions",
        status: "Under Review"
      },
      sender: {
        id: "comp_001",
        name: "TechCorp Solutions",
        logo: "https://example.com/logo.png"
      },
      timestamp: "2024-01-12T11:15:00Z",
      isRead: true,
      priority: "medium"
    },
    {
      id: "notif_005",
      type: "JOB_SHARED",
      title: "Job Post Shared",
      message: "InnovateTech shared a job post with you: Data Scientist",
      jobPost: {
        id: "job_002",
        title: "Data Scientist",
        company: "InnovateTech",
        location: "New York, NY",
        type: "Full-time",
        salary: "$130k - $200k"
      },
      sender: {
        id: "comp_002",
        name: "InnovateTech",
        logo: "https://example.com/logo2.png"
      },
      timestamp: "2024-01-11T09:30:00Z",
      isRead: true,
      priority: "low"
    }
  ]

  useEffect(() => {
    // Simulate API call to get user and notifications
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setCurrentUser(mockCurrentUser)
        setNotifications(mockNotifications)
        setFilteredNotifications(mockNotifications)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = notifications.filter(notification => {
      // Search query
      if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Filter by type
      if (selectedFilter !== "all" && notification.type !== selectedFilter) {
        return false
      }

      return true
    })

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, selectedFilter])

  const markAsRead = async (notificationId) => {
    // Simulate API call
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    )
  }

  const markAllAsRead = async () => {
    // Simulate API call
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const deleteNotification = async (notificationId) => {
    // Simulate API call
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "JOB_SHARED":
        return <Briefcase className="w-5 h-5 text-blue-600" />
      case "CHAT_INVITATION":
      case "VI_CHAT_INVITATION":
        return <MessageCircle className="w-5 h-5 text-green-600" />
      case "APPLICATION_UPDATE":
        return <CheckCircle className="w-5 h-5 text-purple-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case "JOB_SHARED":
        return "border-l-blue-500 bg-blue-50"
      case "CHAT_INVITATION":
      case "VI_CHAT_INVITATION":
        return "border-l-green-500 bg-green-50"
      case "APPLICATION_UPDATE":
        return "border-l-purple-500 bg-purple-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    return time.toLocaleDateString()
  }

  const handleJobPostClick = (jobPost) => {
    // Navigate to job detail page
    navigate(`/jobs/${jobPost.id}`)
  }

  const handleChatClick = (chat) => {
    // Navigate to chat page
    navigate(`/chat/${chat.id}`)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="JOBSEEKER" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="JOBSEEKER" onLogout={() => navigate("/login")} />
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Notifications
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with your latest activities and opportunities
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                <Bell className="w-3 h-3 mr-1" />
                {unreadCount} unread
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredNotifications.length} notifications
              </span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-12 pr-4 rounded-xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="h-12 px-4 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="JOB_SHARED">Job Shared</option>
                    <option value="CHAT_INVITATION">Chat Invitation</option>
                    <option value="VI_CHAT_INVITATION">VI Chat Invitation</option>
                    <option value="APPLICATION_UPDATE">Application Update</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={markAllAsRead}
                    className="h-12 px-4"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedFilter !== "all" 
                      ? "Try adjusting your search or filters"
                      : "You're all caught up! Check back later for new updates."
                  }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-300 hover:shadow-lg border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{notification.title}</h3>
                              <Badge 
                                variant="outline" 
                                className={getPriorityColor(notification.priority)}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-3">{notification.message}</p>
                            
                            {/* Job Post Details */}
                            {notification.jobPost && (
                              <Card className="mb-3 bg-white/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold">{notification.jobPost.title}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {notification.jobPost.company} • {notification.jobPost.location}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {notification.jobPost.type} • {notification.jobPost.salary}
                                      </p>
                                    </div>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleJobPostClick(notification.jobPost)}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Job
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Chat Details */}
                            {notification.chat && (
                              <Card className="mb-3 bg-white/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold">{notification.chat.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {notification.chat.company}
                                      </p>
                                      {notification.chat.jobTitle && (
                                        <p className="text-sm text-muted-foreground">
                                          Job: {notification.chat.jobTitle}
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleChatClick(notification.chat)}
                                    >
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      Join Chat
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Sender Info */}
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4" />
                                <span>{notification.sender.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatTimeAgo(notification.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}