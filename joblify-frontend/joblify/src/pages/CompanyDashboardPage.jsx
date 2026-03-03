import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  Building2, 
  Briefcase, 
  Users, 
  Search, 
  Clock, 
  FileText, 
  Settings,
  LogOut,
  Home,
  Bell,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  MessageCircle,
  UserPlus,
  BarChart3,
  Calendar,
  MapPin,
  Globe,
  Send,
  X,
  Users2
} from "lucide-react"

export default function CompanyDashboardPage() {
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState({})
  
  // Broadcast messaging state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)
  const [availableJobs, setAvailableJobs] = useState([])
  const [applicants, setApplicants] = useState([])
  
  // VI Chat Area state
  const [showVIChatModal, setShowVIChatModal] = useState(false)
  const [chatAreaName, setChatAreaName] = useState("")
  const [chatAreaDescription, setChatAreaDescription] = useState("")
  const [selectedChatType, setSelectedChatType] = useState("")
  const [isCreatingChatArea, setIsCreatingChatArea] = useState(false)
  const [chatAreaSuccess, setChatAreaSuccess] = useState(false)
  
  // Combined VI Chat & Broadcast Modal state
  const [showCombinedModal, setShowCombinedModal] = useState(false)
  
  // Applicants Modal state
  const [showApplicantsModal, setShowApplicantsModal] = useState(false)

  // Mock company data - in real app, this would come from authentication context
  useEffect(() => {
    // Simulate API call to get company data
    const fetchCompanyData = async () => {
      try {
        // Mock company data
        const mockCompany = {
          id: 1,
          name: "TechCorp Solutions",
          industry: "Technology & Software",
          size: "51-200 employees",
          email: "hr@techcorp.com",
          role: "COMPANY",
          profileComplete: 85,
          lastLogin: "2024-01-15T10:30:00Z",
          profileUpdated: "2024-01-12T14:20:00Z",
          activeJobs: 12,
          totalApplications: 156,
          viewsThisWeek: 89,
          logo: null,
          location: "San Francisco, CA",
          website: "https://techcorp.com",
          description: "Leading technology solutions provider"
        }

        // Mock applicants data
        const mockApplicants = [
          {
            id: 1,
            name: "Sarah Johnson",
            position: "Frontend Developer",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg",
            experience: "3 years",
            location: "New York, NY",
            appliedDate: "2024-01-15T09:30:00Z",
            status: "pending",
            skills: ["React", "TypeScript", "CSS3"],
            rating: 4.8
          },
          {
            id: 2,
            name: "Michael Chen",
            position: "Backend Engineer",
            avatar: "https://randomuser.me/api/portraits/men/45.jpg",
            experience: "5 years",
            location: "San Francisco, CA",
            appliedDate: "2024-01-14T14:20:00Z",
            status: "reviewed",
            skills: ["Node.js", "Python", "MongoDB"],
            rating: 4.9
          },
          {
            id: 3,
            name: "Emily Rodriguez",
            position: "UX/UI Designer",
            avatar: "https://randomuser.me/api/portraits/women/67.jpg",
            experience: "4 years",
            location: "Austin, TX",
            appliedDate: "2024-01-13T11:15:00Z",
            status: "shortlisted",
            skills: ["Figma", "Adobe XD", "Prototyping"],
            rating: 4.7
          },
          {
            id: 4,
            name: "David Kim",
            position: "DevOps Engineer",
            avatar: "https://randomuser.me/api/portraits/men/23.jpg",
            experience: "6 years",
            location: "Seattle, WA",
            appliedDate: "2024-01-12T16:45:00Z",
            status: "pending",
            skills: ["Docker", "Kubernetes", "AWS"],
            rating: 4.6
          },
          {
            id: 5,
            name: "Lisa Thompson",
            position: "Product Manager",
            avatar: "https://randomuser.me/api/portraits/women/89.jpg",
            experience: "7 years",
            location: "Boston, MA",
            appliedDate: "2024-01-11T10:30:00Z",
            status: "reviewed",
            skills: ["Agile", "Product Strategy", "User Research"],
            rating: 4.9
          },
          {
            id: 6,
            name: "James Wilson",
            position: "Data Scientist",
            avatar: "https://randomuser.me/api/portraits/men/56.jpg",
            experience: "4 years",
            location: "Chicago, IL",
            appliedDate: "2024-01-10T13:20:00Z",
            status: "shortlisted",
            skills: ["Python", "Machine Learning", "SQL"],
            rating: 4.8
          }
        ]

        // Mock metrics data
        const mockMetrics = {
          jobsPosted: 24,
          applicantsThisMonth: 89,
          openPositions: 8,
          totalViews: 1247,
          averageRating: 4.6,
          responseRate: 92
        }

        // Mock recent activity
        const mockActivity = [
          {
            id: 1,
            type: "job_posted",
            message: "Posted new Frontend Developer position",
            timestamp: "2024-01-15T09:30:00Z",
            icon: "📝",
            details: "Frontend Developer - React, TypeScript"
          },
          {
            id: 2,
            type: "application_received",
            message: "Received 15 new applications for Senior Developer",
            timestamp: "2024-01-14T16:45:00Z",
            icon: "👥",
            details: "15 applications received"
          },
          {
            id: 3,
            type: "profile_update",
            message: "Updated company description and benefits",
            timestamp: "2024-01-12T11:20:00Z",
            icon: "🏢",
            details: "Company profile updated"
          },
          {
            id: 4,
            type: "vi_chat_created",
            message: "Created new Virtual Intern chat area",
            timestamp: "2024-01-10T14:15:00Z",
            icon: "💬",
            details: "Summer 2024 Internship Program"
          }
        ]

        setCompany(mockCompany)
        setMetrics(mockMetrics)
        setRecentActivity(mockActivity)
        setApplicants(mockApplicants)
        
        // Mock available jobs for broadcast messaging
        const mockJobs = [
          {
            id: "job1",
            title: "Frontend Developer",
            applicants: 15,
            status: "active"
          },
          {
            id: "job2", 
            title: "Backend Engineer",
            applicants: 23,
            status: "active"
          },
          {
            id: "job3",
            title: "UX/UI Designer",
            applicants: 8,
            status: "active"
          }
        ]
        setAvailableJobs(mockJobs)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching company data:", error)
        setIsLoading(false)
      }
    }

    fetchCompanyData()
  }, [])

  // Check if user has COMPANY role
  useEffect(() => {
    if (company && company.role !== "COMPANY") {
      navigate("/login", { 
        state: { 
          message: "Access denied. Only company representatives can access this dashboard." 
        } 
      })
    }
  }, [company, navigate])

  const handleLogout = () => {
    // In real app, this would clear authentication tokens
    navigate("/login", { 
      state: { 
        message: "You have been logged out successfully." 
      } 
    })
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/company/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Broadcast messaging functions
  const handleSendBroadcast = async () => {
    if (!selectedJob || !broadcastMessage.trim()) {
      return
    }

    setIsSendingBroadcast(true)
    
    try {
      // Simulate API call to send broadcast message
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reset form and show success
      setBroadcastMessage("")
      setSelectedJob("")
      setBroadcastSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setBroadcastSuccess(false)
        setShowBroadcastModal(false)
      }, 3000)
      
      console.log(`Broadcast sent to applicants of job: ${selectedJob}`)
      
    } catch (error) {
      console.error("Error sending broadcast:", error)
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  const openBroadcastModal = () => {
    setShowBroadcastModal(true)
    setBroadcastMessage("")
    setSelectedJob("")
    setBroadcastSuccess(false)
  }

  const closeBroadcastModal = () => {
    setShowBroadcastModal(false)
    setBroadcastMessage("")
    setSelectedJob("")
    setBroadcastSuccess(false)
  }

  // VI Chat Area functions
  const openVIChatModal = () => {
    setShowVIChatModal(true)
    setChatAreaName("")
    setChatAreaDescription("")
    setSelectedChatType("")
    setChatAreaSuccess(false)
  }

  const openCombinedModal = () => {
    setShowCombinedModal(true)
  }

  const closeCombinedModal = () => {
    setShowCombinedModal(false)
  }

  const openApplicantsModal = () => {
    setShowApplicantsModal(true)
  }

  const closeApplicantsModal = () => {
    setShowApplicantsModal(false)
  }

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'reviewed':
        return 'default'
      case 'shortlisted':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review'
      case 'reviewed':
        return 'Reviewed'
      case 'shortlisted':
        return 'Shortlisted'
      default:
        return 'Pending'
    }
  }

  const closeVIChatModal = () => {
    setShowVIChatModal(false)
    setChatAreaName("")
    setChatAreaDescription("")
    setSelectedChatType("")
    setChatAreaSuccess(false)
  }

  const handleCreateChatArea = async () => {
    if (!chatAreaName.trim() || !chatAreaDescription.trim() || !selectedChatType) {
      return
    }

    setIsCreatingChatArea(true)
    
    try {
      // Simulate API call to create chat area
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reset form and show success
      setChatAreaName("")
      setChatAreaDescription("")
      setSelectedChatType("")
      setChatAreaSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setChatAreaSuccess(false)
        setShowVIChatModal(false)
      }, 3000)
      
      console.log(`VI Chat Area created: ${chatAreaName}`)
      
    } catch (error) {
      console.error("Error creating chat area:", error)
    } finally {
      setIsCreatingChatArea(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={handleLogout} onOpenVIChat={openCombinedModal} onOpenApplicants={openApplicantsModal} />
        <main className="flex-1 lg:ml-64 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!company || company.role !== "COMPANY") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={handleLogout} onOpenVIChat={openCombinedModal} onOpenApplicants={openApplicantsModal} />
        <main className="flex-1 lg:ml-64 transition-all duration-300 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this dashboard.
            </p>
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="COMPANY" onLogout={handleLogout} onOpenVIChat={openCombinedModal} onOpenApplicants={openApplicantsModal} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-4xl">🏢</span>
              )}
            </div>
            {/* <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent mb-3"> */}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Welcome back, {company.name}! 🏢
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Manage your company profile, post jobs, review applicants, and connect with virtual interns.
            </p>
            
            {/* Company Info Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge variant="outline" className="px-3 py-1">
                <MapPin className="w-3 h-3 mr-1" />
                {company.location}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Building2 className="w-3 h-3 mr-1" />
                {company.industry}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-3 h-3 mr-1" />
                {company.size}
              </Badge>
              {company.website && (
                <Badge variant="outline" className="px-3 py-1">
                  <Globe className="w-3 h-3 mr-1" />
                  Website
                </Badge>
              )}
            </div>
            
            {/* Profile Completion Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Profile Completion</span>
                <span className="text-sm font-semibold text-primary">{company.profileComplete}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${company.profileComplete}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for candidates, skills, job titles, or applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-6 rounded-xl bg-primary hover:bg-primary/90"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold text-green-600">{metrics.jobsPosted}</div>
              <div className="text-xs text-muted-foreground">Jobs Posted</div>
            </Card>

            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold text-primary">{metrics.applicantsThisMonth}</div>
              <div className="text-xs text-muted-foreground">Applicants (Month)</div>
            </Card>

            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xl font-bold text-primary">{metrics.openPositions}</div>
              <div className="text-xs text-muted-foreground">Open Positions</div>
            </Card>

            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xl font-bold text-green-600">{metrics.totalViews}</div>
              <div className="text-xs text-muted-foreground">Total Views</div>
            </Card>

            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-xl font-bold text-yellow-600">{metrics.averageRating}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </Card>

            <Card className="text-center p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-600">{metrics.responseRate}%</div>
              <div className="text-xs text-muted-foreground">Response Rate</div>
            </Card>
          </div>

          {/* Primary Action Cards - Row 1: Profile & Job Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Update Company Profile Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Edit className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Update Company Profile</CardTitle>
                <CardDescription>
                  Keep your company information current and attractive to candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-primary to-secondary/80 hover:from-primary/90 hover:to-secondary/70"
                >
                  <Link to="/company/profile">
                    Manage Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Post Job Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Post New Job</CardTitle>
                <CardDescription>
                  Create and publish new job opportunities to attract talent
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-secondary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Link to="/post-job">
                    Create Job Post
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Primary Action Cards - Row 2: Applicants & Jobseekers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* View Applicants Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-accent/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-green" />
                </div>
                <CardTitle className="text-xl">View Applicants</CardTitle>
                <CardDescription>
                  Review and manage job applications with filtering options
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full border-2 border-green-500/50 hover:border-green-500/70 hover:bg-green-500/10"
                >
                  <Link to="/company/applicants">
                    Review Applications
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* View Jobseekers Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-green-500/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">View Jobseekers</CardTitle>
                <CardDescription>
                  Browse candidate profiles for hiring or virtual internships
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full border-2 border-green-500/50 hover:border-green-500/70 hover:bg-green-500/10"
                >
                  <Link to="/jobseekers">
                    Browse Candidates
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applicants Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Applicants</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/company/applicants">View All Applications</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applicants.map((applicant) => (
                <Card key={applicant.id} className="hover:shadow-lg transition-shadow duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img 
                          src={applicant.avatar} 
                          alt={applicant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{applicant.rating}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{applicant.name}</h3>
                        <p className="text-sm text-muted-foreground">{applicant.position}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusBadgeVariant(applicant.status)} className="text-xs">
                          {getStatusLabel(applicant.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(applicant.appliedDate)}
                        </span>
                      </div>
                      
                      {/* Experience & Location */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {applicant.experience}
                        </span>
                        <span className="text-muted-foreground">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {applicant.location}
                        </span>
                      </div>
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {applicant.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                            {skill}
                          </Badge>
                        ))}
                        {applicant.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{applicant.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/company/applicants/${applicant.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => openBroadcastModal()}
                      >
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Primary Action Cards - Row 3: Communication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Create VI Chat Area Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-purple-500/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Create VI Chat Area</CardTitle>
                <CardDescription>
                  Set up communication spaces for virtual interns and team collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={openVIChatModal}
                  variant="outline"
                  className="w-full border-2 border-purple-500/50 hover:border-purple-500/70 hover:bg-purple-500/10 text-purple-600 hover:text-purple-700"
                >
                  Create Chat Area
                </Button>
              </CardContent>
            </Card>

            {/* Broadcast Message Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-blue-500/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users2 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Broadcast Message</CardTitle>
                <CardDescription>
                  Send messages to all applicants of a specific job position
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={openBroadcastModal}
                  variant="outline"
                  className="w-full border-2 border-blue-500/50 hover:border-blue-500/70 hover:bg-blue-500/10 text-blue-600 hover:text-blue-700"
                >
                  Send Broadcast
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center text-lg">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.details} • {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Broadcast Message Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Send Broadcast Message</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeBroadcastModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {broadcastSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✅</span>
                  </div>
                  <h3 className="text-xl font-semibold text-green-600 mb-2">Message Sent Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your broadcast message has been sent to all applicants of the selected job position.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSendBroadcast(); }}>
                  {/* Job Selection */}
                  <div className="mb-6">
                    <Label htmlFor="jobSelect" className="text-sm font-semibold mb-3 block">
                      Select Job Position
                    </Label>
                    <select
                      id="jobSelect"
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:border-primary focus:ring-primary/20 transition-colors"
                      required
                    >
                      <option value="">Choose a job position...</option>
                      {availableJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({job.applicants} applicants)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message Input */}
                  <div className="mb-6">
                    <Label htmlFor="broadcastMessage" className="text-sm font-semibold mb-3 block">
                      Broadcast Message
                    </Label>
                    <textarea
                      id="broadcastMessage"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type your message here... This will be sent to all applicants of the selected job position."
                      className="w-full p-3 border border-border rounded-lg focus:border-primary focus:ring-primary/20 transition-colors min-h-[120px] resize-y"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      This message will be sent to all applicants of the selected job position.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="submit" 
                      disabled={isSendingBroadcast || !selectedJob || !broadcastMessage.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      {isSendingBroadcast ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={closeBroadcastModal}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VI Chat Area Creation Modal */}
      {showVIChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Create VI Chat Area</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeVIChatModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {chatAreaSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✅</span>
                  </div>
                  <h3 className="text-xl font-semibold text-green-600 mb-2">Chat Area Created Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your virtual intern chat area has been created and is ready for use.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleCreateChatArea(); }}>
                  {/* Chat Area Name */}
                  <div className="mb-6">
                    <Label htmlFor="chatAreaName" className="text-sm font-semibold mb-3 block">
                      Chat Area Name
                    </Label>
                    <Input
                      id="chatAreaName"
                      value={chatAreaName}
                      onChange={(e) => setChatAreaName(e.target.value)}
                      placeholder="Enter chat area name (e.g., Frontend Team, Project Alpha)"
                      className="w-full"
                      required
                    />
                  </div>

                  {/* Chat Area Type */}
                  <div className="mb-6">
                    <Label htmlFor="chatType" className="text-sm font-semibold mb-3 block">
                      Chat Area Type
                    </Label>
                    <select
                      id="chatType"
                      value={selectedChatType}
                      onChange={(e) => setSelectedChatType(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:border-primary focus:ring-primary/20 transition-colors"
                      required
                    >
                      <option value="">Select chat area type...</option>
                      <option value="team">Team Collaboration</option>
                      <option value="project">Project Specific</option>
                      <option value="mentorship">Mentorship</option>
                      <option value="general">General Discussion</option>
                    </select>
                  </div>

                  {/* Chat Area Description */}
                  <div className="mb-6">
                    <Label htmlFor="chatAreaDescription" className="text-sm font-semibold mb-3 block">
                      Description
                    </Label>
                    <textarea
                      id="chatAreaDescription"
                      value={chatAreaDescription}
                      onChange={(e) => setChatAreaDescription(e.target.value)}
                      placeholder="Describe the purpose and guidelines for this chat area..."
                      className="w-full p-3 border border-border rounded-lg focus:border-primary focus:ring-primary/20 transition-colors min-h-[100px] resize-y"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="submit" 
                      disabled={isCreatingChatArea || !chatAreaName.trim() || !chatAreaDescription.trim() || !selectedChatType}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      {isCreatingChatArea ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Create Chat Area
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={closeVIChatModal}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Combined VI Chat & Broadcast Modal */}
      {showCombinedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Communication Hub</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCombinedModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create VI Chat Area Card */}
                <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-purple-500/30">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">Create VI Chat Area</CardTitle>
                    <CardDescription>
                      Set up communication spaces for virtual interns and team collaboration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      onClick={() => {
                        closeCombinedModal()
                        openVIChatModal()
                      }}
                      variant="outline"
                      className="w-full border-2 border-purple-500/50 hover:border-purple-500/70 hover:bg-purple-500/10 text-purple-600 hover:text-purple-700"
                    >
                      Create Chat Area
                    </Button>
                  </CardContent>
                </Card>

                {/* Broadcast Message Card */}
                <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-blue-500/30">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Broadcast Message</CardTitle>
                    <CardDescription>
                      Send messages to all applicants of a specific job position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      onClick={() => {
                        closeCombinedModal()
                        openBroadcastModal()
                      }}
                      variant="outline"
                      className="w-full border-2 border-blue-500/50 hover:border-blue-500/70 hover:bg-blue-500/10 text-blue-600 hover:text-blue-700"
                    >
                      Send Broadcast
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Choose an action to manage your company's communication needs
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {showApplicantsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">All Applicants</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeApplicantsModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applicants.map((applicant) => (
                  <Card key={applicant.id} className="hover:shadow-lg transition-shadow duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={applicant.avatar} 
                            alt={applicant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">{applicant.rating}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{applicant.name}</h3>
                          <p className="text-sm text-muted-foreground">{applicant.position}</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusBadgeVariant(applicant.status)} className="text-xs">
                            {getStatusLabel(applicant.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(applicant.appliedDate)}
                          </span>
                        </div>
                        
                        {/* Experience & Location */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {applicant.experience}
                          </span>
                          <span className="text-muted-foreground">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {applicant.location}
                          </span>
                        </div>
                        
                        {/* Skills */}
                        <div className="flex flex-wrap gap-1">
                          {applicant.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                              {skill}
                            </Badge>
                          ))}
                          {applicant.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              +{applicant.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => {
                            closeApplicantsModal()
                            // In a real app, this would navigate to the applicant's profile
                            console.log(`Viewing profile of ${applicant.name}`)
                          }}
                        >
                          View Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => {
                            closeApplicantsModal()
                            openBroadcastModal()
                          }}
                        >
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Showing {applicants.length} applicants • Use the dashboard cards for quick actions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 