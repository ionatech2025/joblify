import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users
} from "lucide-react"

export default function MyApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock data
  const mockApplications = [
    {
      id: "app_001",
      jobPostId: "job_001",
      status: "ACCEPTED",
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resumeUrl: "https://example.com/resume1.pdf",
      coverLetter: "I'm excited to apply for this position. With 8+ years of experience in React development...",
      jobPost: {
        id: "job_001",
        title: "Senior React Developer",
        company: {
          id: "comp_001",
          name: "TechCorp Solutions",
          logo: "https://example.com/logo.png",
          isVerified: true,
          location: "San Francisco, CA"
        },
        location: "San Francisco, CA",
        salary: "$120,000 - $150,000",
        type: "Full-time",
        hasChat: true
      }
    },
    {
      id: "app_002",
      jobPostId: "job_002",
      status: "PENDING",
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resumeUrl: "https://example.com/resume2.pdf",
      coverLetter: "I'm passionate about UX/UI design and have a strong portfolio...",
      jobPost: {
        id: "job_002",
        title: "UX/UI Designer",
        company: {
          id: "comp_002",
          name: "StartupXYZ",
          logo: "https://example.com/logo2.png",
          isVerified: false,
          location: "Austin, TX"
        },
        location: "Austin, TX",
        salary: "$80,000 - $100,000",
        type: "Full-time",
        hasChat: false
      }
    },
    {
      id: "app_003",
      jobPostId: "job_003",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rejectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      rejectionReason: "We found a candidate with more experience in our specific tech stack.",
      resumeUrl: "https://example.com/resume3.pdf",
      coverLetter: "I'm a backend developer with strong Python skills...",
      jobPost: {
        id: "job_003",
        title: "Backend Engineer",
        company: {
          id: "comp_003",
          name: "DataSystems",
          logo: "https://example.com/logo3.png",
          isVerified: true,
          location: "Remote"
        },
        location: "Remote",
        salary: "$100,000 - $130,000",
        type: "Full-time",
        hasChat: false
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setApplications(mockApplications)
      setIsLoading(false)
    }, 1000)
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === "PENDING").length,
    accepted: applications.filter(app => app.status === "ACCEPTED").length,
    rejected: applications.filter(app => app.status === "REJECTED").length
  }

  const filteredApplications = selectedStatus === "all" 
    ? applications 
    : applications.filter(app => app.status === selectedStatus)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const time = new Date(date)
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    return time.toLocaleDateString()
  }

  const canAccessChat = (application) => {
    return application.status === "ACCEPTED" && application.jobPost.hasChat
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4" />
      case "REJECTED":
        return <XCircle className="w-4 h-4" />
      case "PENDING":
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="JOBSEEKER" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="JOBSEEKER" onLogout={() => navigate("/login")} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary/80 bg-clip-text text-transparent mb-3">
              My Applications
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track the status of your job applications and communicate with hiring teams
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </CardContent>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.accepted}</div>
                <div className="text-sm text-muted-foreground">Accepted</div>
              </CardContent>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={selectedStatus === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("PENDING")}
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={selectedStatus === "ACCEPTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("ACCEPTED")}
              >
                Accepted ({stats.accepted})
              </Button>
              <Button
                variant={selectedStatus === "REJECTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("REJECTED")}
              >
                Rejected ({stats.rejected})
              </Button>
            </div>
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedStatus === "all" 
                    ? "You haven't applied to any jobs yet."
                    : `No ${selectedStatus.toLowerCase()} applications found.`
                  }
                </p>
                <Button onClick={() => navigate("/jobs")}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold">
                                {application.jobPost.title}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(application.status)}`}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(application.status)}
                                  <span>{application.status}</span>
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-1" />
                                {application.jobPost.company.name}
                                {application.jobPost.company.isVerified && (
                                  <span className="ml-1 text-blue-600">✓</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {application.jobPost.location}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Applied {formatTimeAgo(application.appliedAt)}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {application.jobPost.salary}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {application.jobPost.type}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Messages */}
                        {application.status === "ACCEPTED" && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-green-700">Application Accepted!</span>
                            </div>
                            <p className="text-sm text-green-600 mb-3">
                              Congratulations! Your application has been accepted. 
                              The hiring team will contact you with next steps.
                            </p>
                            {application.acceptedAt && (
                              <p className="text-xs text-green-600">
                                Accepted on {formatDate(application.acceptedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {application.status === "REJECTED" && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-red-700">Application Rejected</span>
                            </div>
                            <p className="text-sm text-red-600 mb-3">
                              {application.rejectionReason || "Your application was not selected for this position."}
                            </p>
                            {application.rejectedAt && (
                              <p className="text-xs text-red-600">
                                Rejected on {formatDate(application.rejectedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {application.status === "PENDING" && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <span className="font-semibold text-yellow-700">Under Review</span>
                            </div>
                            <p className="text-sm text-yellow-600">
                              Your application is currently being reviewed by the hiring team. 
                              We'll notify you once a decision has been made.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/jobs/${application.jobPost.id}`)}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Job
                        </Button>
                        
                        {canAccessChat(application) && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/chat/${application.jobPost.id}`)}
                            className="flex items-center bg-green-500 hover:bg-green-600 text-white"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Join Chat
                          </Button>
                        )}

                        {application.status === "ACCEPTED" && !application.jobPost.hasChat && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="flex items-center"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat Not Available
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Download resume functionality
                            window.open(application.resumeUrl, '_blank')
                          }}
                          className="flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}