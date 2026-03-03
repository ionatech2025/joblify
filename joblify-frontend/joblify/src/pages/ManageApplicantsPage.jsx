import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  MessageCircle,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Download,
  ExternalLink,
  Star,
  Award,
  GraduationCap,
  Building2,
  Globe,
  Linkedin,
  Users,
  UserPlus,
  UserMinus,
  Send,
  Archive,
  AlertCircle
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"

export default function ManageApplicantsPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const [applicants, setApplicants] = useState([])
  const [filteredApplicants, setFilteredApplicants] = useState([])
  const [jobPost, setJobPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  // Mock company data
  const [companyProfile] = useState({
    id: "comp_001",
    name: "TechCorp Solutions",
    isVerified: true,
    isActive: true,
    isPremium: true
  })

  // Mock job post data
  const mockJobPost = {
    id: "job_001",
    title: "Senior React Developer",
    description: "We're looking for an experienced React developer to join our team...",
    category: "Software Development",
    jobType: "FULL_TIME",
    location: "San Francisco, CA",
    locationType: "hybrid",
    experienceLevel: "senior",
    salary: { min: 120000, max: 180000, currency: "USD" },
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "ACTIVE",
    hasChat: true,
    chatThreadId: "chat_001",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    totalApplications: 12,
    pendingApplications: 8,
    acceptedApplications: 3,
    rejectedApplications: 1
  }

  // Mock applicants data
  const mockApplicants = [
    {
      id: "app_001",
      jobPostId: "job_001",
      jobseekerId: "js_001",
      status: "PENDING",
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resumeUrl: "https://example.com/resume1.pdf",
      coverLetter: "I'm excited to apply for this position. With 8+ years of experience in React development...",
      jobseeker: {
        id: "js_001",
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        experienceLevel: "senior",
        skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
        bio: "Senior Full-Stack Developer with 8+ years of experience building scalable web applications.",
        education: [
          {
            institution: "Stanford University",
            degree: "Bachelor of Science in Computer Science",
            year: "2015"
          }
        ],
        workExperience: [
          {
            title: "Senior Software Engineer",
            company: "Google",
            duration: "2020-2023",
            description: "Led development of internal tools and APIs"
          }
        ],
        certifications: [
          "AWS Certified Solutions Architect",
          "Google Cloud Professional Developer"
        ],
        portfolio: "https://sarahjohnson.dev",
        linkedin: "https://linkedin.com/in/sarahjohnson",
        rating: 4.8,
        totalReviews: 12
      }
    },
    {
      id: "app_002",
      jobPostId: "job_001",
      jobseekerId: "js_002",
      status: "ACCEPTED",
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      resumeUrl: "https://example.com/resume2.pdf",
      coverLetter: "I believe my background in React and modern web technologies makes me an ideal candidate...",
      jobseeker: {
        id: "js_002",
        name: "Michael Chen",
        email: "michael.chen@email.com",
        phone: "+1 (555) 234-5678",
        location: "New York, NY",
        experienceLevel: "senior",
        skills: ["React", "JavaScript", "Python", "MongoDB", "GraphQL"],
        bio: "Experienced developer with strong focus on user experience and performance optimization.",
        education: [
          {
            institution: "MIT",
            degree: "Master of Science in Computer Science",
            year: "2018"
          }
        ],
        workExperience: [
          {
            title: "Frontend Lead",
            company: "Facebook",
            duration: "2019-2023",
            description: "Led frontend development for major features"
          }
        ],
        certifications: ["React Advanced Certification"],
        portfolio: "https://michaelchen.dev",
        linkedin: "https://linkedin.com/in/michaelchen",
        rating: 4.6,
        totalReviews: 8
      }
    },
    {
      id: "app_003",
      jobPostId: "job_001",
      jobseekerId: "js_003",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rejectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rejectionReason: "Insufficient experience with required technologies",
      resumeUrl: "https://example.com/resume3.pdf",
      coverLetter: "I'm a passionate developer looking to grow in this role...",
      jobseeker: {
        id: "js_003",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@email.com",
        phone: "+1 (555) 345-6789",
        location: "Austin, TX",
        experienceLevel: "mid",
        skills: ["Vue.js", "JavaScript", "PHP", "MySQL", "Laravel"],
        bio: "Mid-level developer with 4 years of experience in modern web technologies.",
        education: [
          {
            institution: "University of Texas",
            degree: "Bachelor of Science in Software Engineering",
            year: "2019"
          }
        ],
        workExperience: [
          {
            title: "Frontend Developer",
            company: "TechStart Inc",
            duration: "2021-2023",
            description: "Developed user interfaces and improved user experience"
          }
        ],
        certifications: ["Vue.js Certification"],
        portfolio: "https://emilyrodriguez.dev",
        linkedin: "https://linkedin.com/in/emilyrodriguez",
        rating: 4.2,
        totalReviews: 5
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobPost(mockJobPost)
      setApplicants(mockApplicants)
      setFilteredApplicants(mockApplicants)
      setIsLoading(false)
    }, 1000)
  }, [jobId])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = applicants.filter(applicant => {
      // Search query
      if (searchQuery && !applicant.jobseeker.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (selectedStatus && applicant.status !== selectedStatus) {
        return false
      }

      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "date":
          aValue = a.appliedAt
          bValue = b.appliedAt
          break
        case "name":
          aValue = a.jobseeker.name
          bValue = b.jobseeker.name
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a.appliedAt
          bValue = b.appliedAt
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredApplicants(filtered)
  }, [applicants, searchQuery, selectedStatus, sortBy, sortOrder])

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStatus("")
    setSortBy("date")
    setSortOrder("desc")
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffTime = Math.abs(now - new Date(date))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: "yellow", label: "Pending", icon: Clock },
      ACCEPTED: { color: "green", label: "Accepted", icon: CheckCircle },
      REJECTED: { color: "red", label: "Rejected", icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    const colorClasses = {
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700"
    }

    return (
      <Badge variant="outline" className={colorClasses[config.color]}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleAccept = async () => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update applicant status
    setApplicants(prev => prev.map(app => 
      app.id === selectedApplicant.id 
        ? { ...app, status: "ACCEPTED", acceptedAt: new Date() }
        : app
    ))
    
    setShowAcceptModal(false)
    setShowDetailModal(false)
    setSelectedApplicant(null)
    setIsProcessing(false)
    
    // Show success message
    alert(`Successfully accepted ${selectedApplicant.jobseeker.name}! They have been added to the job chat.`)
  }

  const handleReject = async () => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update applicant status
    setApplicants(prev => prev.map(app => 
      app.id === selectedApplicant.id 
        ? { 
            ...app, 
            status: "REJECTED", 
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || "No reason provided"
          }
        : app
    ))
    
    setShowRejectModal(false)
    setShowDetailModal(false)
    setSelectedApplicant(null)
    setRejectionReason("")
    setIsProcessing(false)
    
    // Show success message
    alert(`Application from ${selectedApplicant.jobseeker.name} has been rejected.`)
  }

  const canAccept = (applicant) => {
    return applicant.status === "PENDING"
  }

  const canReject = (applicant) => {
    return applicant.status === "PENDING"
  }

  // Access control check
  if (!companyProfile.isVerified) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-4">Access Restricted</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your company account needs to be verified before you can manage applicants. 
                Please contact support to complete the verification process.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/company")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!companyProfile.isActive) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-yellow-600 mb-4">Account Suspended</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your company account has been suspended. Please contact support to resolve this issue.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/company")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading applicants...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/my-job-posts")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Posts
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent mb-3">
              Manage Applicants
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Review and manage applications for your job posting
            </p>
            
            {/* Job Post Info */}
            {jobPost && (
              <div className="mt-6 max-w-4xl mx-auto">
                <Card className="bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{jobPost.title}</h2>
                        <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {jobPost.location} ({jobPost.locationType})
                          </span>
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {jobPost.jobType}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {jobPost.totalApplications} applications
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {jobPost.hasChat && (
                          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Chat Enabled
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {jobPost.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Application Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{jobPost.pendingApplications}</div>
                        <div className="text-sm text-yellow-700">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{jobPost.acceptedApplications}</div>
                        <div className="text-sm text-green-700">Accepted</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{jobPost.rejectedApplications}</div>
                        <div className="text-sm text-red-700">Rejected</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{jobPost.totalApplications}</div>
                        <div className="text-sm text-blue-700">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
                    placeholder="Search applicants by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-secondary/50 focus:ring-secondary/20 transition-all duration-300"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Sort By</Label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-secondary/50 focus:ring-secondary/20 transition-all duration-300"
                    >
                      <option value="date">Application Date</option>
                      <option value="name">Name</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Order</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant={sortOrder === "desc" ? "default" : "outline"}
                        onClick={() => setSortOrder("desc")}
                        className="flex-1 rounded-r-none"
                      >
                        <SortDesc className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={sortOrder === "asc" ? "default" : "outline"}
                        onClick={() => setSortOrder("asc")}
                        className="flex-1 rounded-l-none"
                      >
                        <SortAsc className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {filteredApplicants.length} of {applicants.length} applicants
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Applicants List */}
          {filteredApplicants.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Applicants Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedStatus 
                    ? "Try adjusting your search criteria or filters to find more applicants."
                    : "No applications have been submitted for this job posting yet."
                  }
                </p>
                {(searchQuery || selectedStatus) && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplicants.map((applicant) => (
                <Card 
                  key={applicant.id} 
                  className="group hover:shadow-xl transition-all duration-500 border-2 border-border/50 hover:border-secondary/30"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Applicant Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>

                        {/* Applicant Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold group-hover:text-secondary transition-colors">
                              {applicant.jobseeker.name}
                            </h3>
                            {getStatusBadge(applicant.status)}
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm ml-1">{applicant.jobseeker.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {applicant.jobseeker.location}
                            </span>
                            <span className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-1" />
                              {applicant.jobseeker.experienceLevel}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Applied {formatTimeAgo(applicant.appliedAt)}
                            </span>
                          </div>

                          {/* Skills */}
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {applicant.jobseeker.skills.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {applicant.jobseeker.skills.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{applicant.jobseeker.skills.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Bio Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {applicant.jobseeker.bio}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplicant(applicant)
                            setShowDetailModal(true)
                          }}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        {canAccept(applicant) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setShowAcceptModal(true)
                            }}
                            className="flex items-center bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        )}
                        
                        {canReject(applicant) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setShowRejectModal(true)
                            }}
                            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        )}

                        {applicant.status === "ACCEPTED" && jobPost?.hasChat && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/chat/${jobPost.chatThreadId}`)}
                            className="flex items-center"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Applicant Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Applicant Details
            </DialogTitle>
            <DialogDescription>
              Review applicant information and take action
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedApplicant.jobseeker.name}</h2>
                    <div className="flex items-center space-x-3 mt-2">
                      {getStatusBadge(selectedApplicant.status)}
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1">{selectedApplicant.jobseeker.rating}</span>
                        <span className="text-muted-foreground ml-1">({selectedApplicant.jobseeker.totalReviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{selectedApplicant.jobseeker.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{selectedApplicant.jobseeker.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{selectedApplicant.jobseeker.location}</span>
                  </div>
                  {selectedApplicant.jobseeker.portfolio && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a 
                        href={selectedApplicant.jobseeker.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Portfolio
                      </a>
                    </div>
                  )}
                  {selectedApplicant.jobseeker.linkedin && (
                    <div className="flex items-center">
                      <Linkedin className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a 
                        href={selectedApplicant.jobseeker.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Applied:</span>
                    <span>{formatDate(selectedApplicant.appliedAt)}</span>
                  </div>
                  {selectedApplicant.resumeUrl && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Resume:</span>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Resume
                      </Button>
                    </div>
                  )}
                  {selectedApplicant.coverLetter && (
                    <div>
                      <h4 className="font-semibold mb-2">Cover Letter:</h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">{selectedApplicant.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.jobseeker.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApplicant.jobseeker.education.map((edu, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <h4 className="font-semibold">{edu.institution}</h4>
                      <p className="text-muted-foreground">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">{edu.year}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Work Experience */}
              {selectedApplicant.jobseeker.workExperience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplicant.jobseeker.workExperience.map((exp, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">{exp.duration}</p>
                        <p className="text-sm mt-2">{exp.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                {canAccept(selectedApplicant) && (
                  <Button 
                    onClick={() => setShowAcceptModal(true)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Applicant
                  </Button>
                )}
                {canReject(selectedApplicant) && (
                  <Button 
                    onClick={() => setShowRejectModal(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Applicant
                  </Button>
                )}
                {selectedApplicant.status === "ACCEPTED" && jobPost?.hasChat && (
                  <Button 
                    onClick={() => navigate(`/chat/${jobPost.chatThreadId}`)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Applicant</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept {selectedApplicant?.jobseeker.name} for this position?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-700">What happens when you accept:</h4>
              <ul className="space-y-1 text-sm text-green-600">
                <li>• Applicant status will be updated to "Accepted"</li>
                <li>• Applicant will be notified of acceptance</li>
                {jobPost?.hasChat && (
                  <li>• Applicant will be added to the job chat area</li>
                )}
                <li>• You can communicate directly with the applicant</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Applicant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Applicant</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedApplicant?.jobseeker.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-semibold">
                Optional: Reason for rejection
              </Label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback to help the applicant improve..."
                className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-secondary/50 focus:ring-secondary/20 transition-all duration-300 mt-2 resize-none"
                rows={3}
              />
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-700">What happens when you reject:</h4>
              <ul className="space-y-1 text-sm text-yellow-600">
                <li>• Applicant status will be updated to "Rejected"</li>
                <li>• Applicant will be notified of the decision</li>
                <li>• Applicant will not be added to the job chat</li>
                <li>• You can still view the application for reference</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isProcessing}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Applicant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 