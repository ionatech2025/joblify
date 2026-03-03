import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { 
  Search, 
  Filter, 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Crown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X
} from "lucide-react"

export default function ApplicationTrackingPage() {
  const navigate = useNavigate()
  
  // State management
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationDetail, setShowApplicationDetail] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  
  // Application status options
  const applicationStatuses = [
    { value: "NOT_VIEWED", label: "Not Viewed", color: "bg-gray-500", description: "Application submitted but not yet reviewed" },
    { value: "VIEWED", label: "Viewed", color: "bg-blue-500", description: "Application has been reviewed by the company" },
    { value: "SHORTLISTED", label: "Shortlisted", color: "bg-yellow-500", description: "Application has been shortlisted for further consideration" },
    { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "bg-purple-500", description: "Interview has been scheduled" },
    { value: "REJECTED", label: "Rejected", color: "bg-red-500", description: "Application was not selected" },
    { value: "ACCEPTED", label: "Accepted", color: "bg-green-500", description: "Application was successful" }
  ]

  // Mock user profile with premium status
  const mockUserProfile = {
    id: "user123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    role: "JOB_SEEKER",
    isPremium: true, // Premium user
    premiumExpiry: "2024-12-31",
    profileComplete: true
  }

  // Mock applications data
  const mockApplications = [
    {
      id: "app1",
      jobTitle: "Senior Frontend Developer",
      company: "TechCorp Solutions",
      companyLogo: null,
      location: "San Francisco, CA",
      salary: "$120k - $180k",
      appliedDate: "2024-01-15T10:30:00Z",
      status: "SHORTLISTED",
      lastUpdated: "2024-01-18T14:20:00Z",
      statusHistory: [
        {
          id: 1,
          status: "NOT_VIEWED",
          timestamp: "2024-01-15T10:30:00Z",
          note: "Application submitted successfully"
        },
        {
          id: 2,
          status: "VIEWED",
          timestamp: "2024-01-16T09:15:00Z",
          note: "Application reviewed by HR team"
        },
        {
          id: 3,
          status: "SHORTLISTED",
          timestamp: "2024-01-18T14:20:00Z",
          note: "Selected for technical interview round"
        }
      ],
      nextSteps: "Technical interview scheduled for next week",
      companyNotes: "Strong technical background, good cultural fit"
    },
    {
      id: "app2",
      jobTitle: "Product Manager",
      company: "HealthFirst Medical",
      companyLogo: null,
      location: "Boston, MA",
      salary: "$100k - $150k",
      appliedDate: "2024-01-10T14:45:00Z",
      status: "VIEWED",
      lastUpdated: "2024-01-12T11:30:00Z",
      statusHistory: [
        {
          id: 1,
          status: "NOT_VIEWED",
          timestamp: "2024-01-10T14:45:00Z",
          note: "Application submitted successfully"
        },
        {
          id: 2,
          status: "VIEWED",
          timestamp: "2024-01-12T11:30:00Z",
          note: "Application under review by product team"
        }
      ],
      nextSteps: "Awaiting team review and feedback",
      companyNotes: "Experience in healthcare products is valuable"
    },
    {
      id: "app3",
      jobTitle: "Data Scientist",
      company: "GreenEnergy Co",
      companyLogo: null,
      location: "Denver, CO",
      salary: "$90k - $130k",
      appliedDate: "2024-01-08T16:20:00Z",
      status: "REJECTED",
      lastUpdated: "2024-01-14T13:45:00Z",
      statusHistory: [
        {
          id: 1,
          status: "NOT_VIEWED",
          timestamp: "2024-01-08T16:20:00Z",
          note: "Application submitted successfully"
        },
        {
          id: 2,
          status: "VIEWED",
          timestamp: "2024-01-12T10:15:00Z",
          note: "Application reviewed by data team"
        },
        {
          id: 3,
          status: "REJECTED",
          timestamp: "2024-01-14T13:45:00Z",
          note: "Position filled by internal candidate"
        }
      ],
      nextSteps: "Position has been filled",
      companyNotes: "Strong candidate but position filled internally"
    },
    {
      id: "app4",
      jobTitle: "UX Designer",
      company: "Creative Studios",
      companyLogo: null,
      location: "Los Angeles, CA",
      salary: "$80k - $120k",
      appliedDate: "2024-01-20T09:00:00Z",
      status: "NOT_VIEWED",
      lastUpdated: "2024-01-20T09:00:00Z",
      statusHistory: [
        {
          id: 1,
          status: "NOT_VIEWED",
          timestamp: "2024-01-20T09:00:00Z",
          note: "Application submitted successfully"
        }
      ],
      nextSteps: "Application pending review",
      companyNotes: null
    }
  ]

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setUserProfile(mockUserProfile)
        setApplications(mockApplications)
        setFilteredApplications(mockApplications)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Apply search and filters
  useEffect(() => {
    let filtered = applications

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(app => app.status === selectedStatus)
    }

    // Apply company filter
    if (selectedCompany) {
      filtered = filtered.filter(app => app.company === selectedCompany)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, selectedStatus, selectedCompany])

  // Get company initials for avatar
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get status badge variant and color
  const getStatusBadge = (status) => {
    const statusInfo = applicationStatuses.find(s => s.value === status)
    if (!statusInfo) return null

    return (
      <Badge 
        className={`${statusInfo.color} text-white border-0 px-3 py-1 font-semibold`}
      >
        {statusInfo.label}
      </Badge>
    )
  }

  // Format time ago
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

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      return
    }
    // Search is already handled by useEffect
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedStatus("")
    setSelectedCompany("")
  }

  // View application details
  const viewApplicationDetail = (application) => {
    setSelectedApplication(application)
    setShowApplicationDetail(true)
  }

  // Close application detail view
  const closeApplicationDetail = () => {
    setShowApplicationDetail(false)
    setSelectedApplication(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Premium access check
  if (!userProfile?.isPremium) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-yellow-600 mb-4">Premium Feature</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Application tracking is a premium feature. Upgrade to Premium to track your job applications 
                in real-time, view detailed status updates, and get insights into your application progress.
              </p>
              <div className="space-y-4">
                <div className="text-left bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Premium Benefits:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Real-time application status tracking</li>
                    <li>✓ Detailed status history and timeline</li>
                    <li>✓ Company feedback and notes</li>
                    <li>✓ Next steps and action items</li>
                    <li>✓ Priority support and notifications</li>
                  </ul>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard/jobseeker")}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/jobseeker")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mr-3">
                Application Tracking
              </h1>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your job applications in real-time with detailed status updates and insights
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                <Crown className="w-3 h-3 mr-1" />
                Premium Feature
              </Badge>
              <span className="text-sm text-muted-foreground">
                Expires: {new Date(userProfile.premiumExpiry).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search applications by job title, company, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Application Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Statuses</option>
                      {applicationStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Company</label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Companies</option>
                      {Array.from(new Set(applications.map(app => app.company))).map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-transparent">Reset</label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full h-12 border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
            {filteredApplications.length === 0 && (
              <p className="text-red-500 font-medium">No applications match your criteria</p>
            )}
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredApplications.map((application) => (
              <Card 
                key={application.id} 
                className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30 bg-white/95 backdrop-blur-sm"
                onClick={() => viewApplicationDetail(application)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {application.companyLogo ? (
                      <img 
                        src={application.companyLogo} 
                        alt={application.company}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {getCompanyInitials(application.company)}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                    {application.jobTitle}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {application.company}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Application Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{application.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span className="text-sm">{application.salary}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">Applied {formatTimeAgo(application.appliedDate)}</span>
                    </div>
                  </div>

                  {/* Status and Last Update */}
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatTimeAgo(application.lastUpdated)}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      viewApplicationDetail(application)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Detail Modal */}
        {showApplicationDetail && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                      {selectedApplication.companyLogo ? (
                        <img 
                          src={selectedApplication.companyLogo} 
                          alt={selectedApplication.company}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {getCompanyInitials(selectedApplication.company)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">
                        {selectedApplication.jobTitle}
                      </h2>
                      <div className="flex items-center space-x-4 text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {selectedApplication.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedApplication.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {selectedApplication.salary}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(selectedApplication.status)}
                        <span className="text-sm text-muted-foreground">
                          Applied {formatTimeAgo(selectedApplication.appliedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeApplicationDetail}
                    className="rounded-full w-10 h-10 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Application Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Current Status */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Current Status</h3>
                      <div className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          {getStatusBadge(selectedApplication.status)}
                          <span className="text-sm text-muted-foreground">
                            Last updated {formatTimeAgo(selectedApplication.lastUpdated)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {applicationStatuses.find(s => s.value === selectedApplication.status)?.description}
                        </p>
                      </div>
                    </div>

                    {/* Next Steps */}
                    {selectedApplication.nextSteps && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Next Steps</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-blue-800">{selectedApplication.nextSteps}</p>
                        </div>
                      </div>
                    )}

                    {/* Company Notes */}
                    {selectedApplication.companyNotes && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Company Notes</h3>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                          <p className="text-green-800">{selectedApplication.companyNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Application Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Application Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {selectedApplication.statusHistory.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Status Updates</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                          <Eye className="w-4 h-4 mr-2" />
                          View Job Details
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Building2 className="w-4 h-4 mr-2" />
                          Company Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Status History Timeline */}
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Status History</h3>
                  <div className="space-y-4">
                    {selectedApplication.statusHistory.map((status, index) => (
                      <div key={status.id} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${
                            index === selectedApplication.statusHistory.length - 1 
                              ? 'bg-primary' 
                              : 'bg-muted'
                          }`} />
                          {index < selectedApplication.statusHistory.length - 1 && (
                            <div className="w-0.5 h-8 bg-muted mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(status.status)}
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(status.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{status.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}