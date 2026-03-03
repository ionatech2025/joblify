import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog"
import { 
  ArrowLeft, 
  Search, 
  Building2, 
  User, 
  Calendar, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Bell,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Check,
  X,
  MessageCircle,
  Star,
  MapPin,
  Briefcase,
  Users,
  Globe,
  Linkedin
} from "lucide-react"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Sidebar } from "../components/Sidebar"

export default function InvitationsPage() {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [filteredInvitations, setFilteredInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvitation, setSelectedInvitation] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  // Mock jobseeker data
  const [jobseekerProfile] = useState({
    id: "js_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    isVerified: true,
    isActive: true,
    profileComplete: 85,
    hasBasicProfile: true,
    hasSkills: true,
    hasResume: true
  })

  // Available filters
  const statusOptions = [
    { value: "PENDING", label: "Pending", color: "yellow" },
    { value: "ACCEPTED", label: "Accepted", color: "green" },
    { value: "DECLINED", label: "Declined", color: "red" }
  ]

  const typeOptions = [
    { value: "EMPLOYABLE", label: "Employable" },
    { value: "VIRTUAL_INTERN", label: "Virtual Intern" }
  ]

  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "company", label: "Company" },
    { value: "type", label: "Type" },
    { value: "status", label: "Status" }
  ]

  // Mock invitations data
  const mockInvitations = [
    {
      id: "inv_001",
      companyId: "comp_001",
      jobseekerId: "js_001",
      type: "EMPLOYABLE",
      status: "PENDING",
      message: "Hi Sarah! We're impressed with your React and TypeScript skills. We'd love to have you join our team as a Senior Frontend Developer. We offer competitive salary, remote work options, and great benefits.",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      company: {
        id: "comp_001",
        name: "TechCorp Solutions",
        logo: null,
        industry: "Technology",
        location: "San Francisco, CA",
        size: "51-200 employees",
        website: "https://techcorp.com",
        linkedin: "https://linkedin.com/company/techcorp",
        description: "Leading technology company specializing in web development and cloud solutions."
      }
    },
    {
      id: "inv_002",
      companyId: "comp_002",
      jobseekerId: "js_001",
      type: "VIRTUAL_INTERN",
      status: "PENDING",
      message: "Hello Sarah! We're looking for talented developers to join our virtual internship program. This is a great opportunity to work on real projects and gain valuable experience.",
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      company: {
        id: "comp_002",
        name: "StartupXYZ",
        logo: null,
        industry: "Startup",
        location: "Austin, TX",
        size: "11-50 employees",
        website: "https://startupxyz.com",
        linkedin: "https://linkedin.com/company/startupxyz",
        description: "Innovative startup focused on creating cutting-edge web applications."
      }
    },
    {
      id: "inv_003",
      companyId: "comp_003",
      jobseekerId: "js_001",
      type: "EMPLOYABLE",
      status: "ACCEPTED",
      message: "We'd love to have you join our team!",
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      company: {
        id: "comp_003",
        name: "Digital Innovations",
        logo: null,
        industry: "Digital Marketing",
        location: "New York, NY",
        size: "201-500 employees",
        website: "https://digitalinnovations.com",
        linkedin: "https://linkedin.com/company/digitalinnovations",
        description: "Digital marketing agency with a focus on technology and innovation."
      }
    },
    {
      id: "inv_004",
      companyId: "comp_004",
      jobseekerId: "js_001",
      type: "VIRTUAL_INTERN",
      status: "DECLINED",
      message: "Join our internship program!",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      declinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      declineReason: "Currently focused on full-time opportunities",
      company: {
        id: "comp_004",
        name: "EduTech Solutions",
        logo: null,
        industry: "Education",
        location: "Boston, MA",
        size: "51-200 employees",
        website: "https://edutechsolutions.com",
        linkedin: "https://linkedin.com/company/edutechsolutions",
        description: "Educational technology company creating innovative learning platforms."
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInvitations(mockInvitations)
      setFilteredInvitations(mockInvitations)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = invitations.filter(invitation => {
      // Search query
      if (searchQuery && !invitation.company.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (selectedStatus && invitation.status !== selectedStatus) {
        return false
      }

      // Type filter
      if (selectedType && invitation.type !== selectedType) {
        return false
      }

      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "date":
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case "company":
          aValue = a.company.name
          bValue = b.company.name
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredInvitations(filtered)
  }, [invitations, searchQuery, selectedStatus, selectedType, sortBy, sortOrder])

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStatus("")
    setSelectedType("")
    setSortBy("date")
    setSortOrder("desc")
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

  const formatExpiryDate = (date) => {
    const now = new Date()
    const diffTime = new Date(date) - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return "Expired"
    if (diffDays === 0) return "Expires today"
    if (diffDays === 1) return "Expires tomorrow"
    if (diffDays < 7) return `Expires in ${diffDays} days`
    return `Expires in ${Math.floor(diffDays / 7)} weeks`
  }

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status)
    if (!statusOption) return null

    const colorClasses = {
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700"
    }

    return (
      <Badge variant="outline" className={colorClasses[statusOption.color]}>
        {status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
        {status === "ACCEPTED" && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === "DECLINED" && <XCircle className="w-3 h-3 mr-1" />}
        {statusOption.label}
      </Badge>
    )
  }

  const getTypeBadge = (type) => {
    const typeOption = typeOptions.find(t => t.value === type)
    if (!typeOption) return null

    return (
      <Badge variant={type === "EMPLOYABLE" ? "default" : "secondary"}>
        {type === "EMPLOYABLE" && <Briefcase className="w-3 h-3 mr-1" />}
        {type === "VIRTUAL_INTERN" && <Users className="w-3 h-3 mr-1" />}
        {typeOption.label}
      </Badge>
    )
  }

  const handleAccept = async () => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update invitation status
    setInvitations(prev => prev.map(inv => 
      inv.id === selectedInvitation.id 
        ? { ...inv, status: "ACCEPTED", acceptedAt: new Date() }
        : inv
    ))
    
    setShowAcceptModal(false)
    setShowDetailModal(false)
    setSelectedInvitation(null)
    setIsProcessing(false)
    
    // Show success message
    alert(`Successfully accepted invitation from ${selectedInvitation.company.name} as ${selectedInvitation.type === "EMPLOYABLE" ? "Employable" : "Virtual Intern"}!`)
  }

  const handleDecline = async () => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update invitation status
    setInvitations(prev => prev.map(inv => 
      inv.id === selectedInvitation.id 
        ? { 
            ...inv, 
            status: "DECLINED", 
            declinedAt: new Date(),
            declineReason: declineReason || "No reason provided"
          }
        : inv
    ))
    
    setShowDeclineModal(false)
    setShowDetailModal(false)
    setSelectedInvitation(null)
    setDeclineReason("")
    setIsProcessing(false)
    
    // Show success message
    alert(`Invitation from ${selectedInvitation.company.name} has been declined.`)
  }

  const isInvitationExpired = (invitation) => {
    return new Date() > new Date(invitation.expiresAt)
  }

  const canRespondToInvitation = (invitation) => {
    return invitation.status === "PENDING" && !isInvitationExpired(invitation)
  }

  // Access control check
  if (!jobseekerProfile.isVerified) {
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
                Your account needs to be verified before you can view invitations. 
                Please contact support to complete the verification process.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/jobseeker")}
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

  if (!jobseekerProfile.isActive) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-yellow-600 mb-4">Account Suspended</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your account has been suspended. Please contact support to resolve this issue.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/jobseeker")}
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

  if (!jobseekerProfile.hasBasicProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-blue-600 mb-4">Complete Your Profile</h1>
              <p className="text-lg text-muted-foreground mb-8">
                You need to complete your basic profile before you can view invitations. 
                Please update your profile information first.
              </p>
              <Button 
                onClick={() => navigate("/profile")}
                className="w-full"
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invitations...</p>
          </div>
        </main>
        <Footer />
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
                  onClick={() => navigate("/dashboard/jobseeker")}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
                Invitations
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Review and respond to invitations from companies
              </p>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {filteredInvitations.length} invitations found
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
                    placeholder="Search invitations by company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Type</Label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Types</option>
                      {typeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Sort By</Label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
                    {filteredInvitations.length} of {invitations.length} invitations
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Invitations List */}
          {filteredInvitations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Invitations Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedStatus || selectedType 
                    ? "Try adjusting your search criteria or filters to find more invitations."
                    : "You don't have any invitations yet. Companies will send you invitations when they're interested in your profile."
                  }
                </p>
                {(searchQuery || selectedStatus || selectedType) && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInvitations.map((invitation) => (
                <Card 
                  key={invitation.id} 
                  className={`group hover:shadow-xl transition-all duration-500 cursor-pointer border-2 ${
                    invitation.status === "PENDING" 
                      ? "border-yellow-200 hover:border-yellow-300" 
                      : invitation.status === "ACCEPTED"
                      ? "border-green-200 hover:border-green-300"
                      : "border-red-200 hover:border-red-300"
                  }`}
                  onClick={() => {
                    setSelectedInvitation(invitation)
                    setShowDetailModal(true)
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Company Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-xl flex items-center justify-center">
                          {invitation.company.logo ? (
                            <img 
                              src={invitation.company.logo} 
                              alt={invitation.company.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-primary" />
                          )}
                        </div>

                        {/* Invitation Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                              {invitation.company.name}
                            </h3>
                            {getStatusBadge(invitation.status)}
                            {getTypeBadge(invitation.type)}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {invitation.company.location}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatTimeAgo(invitation.createdAt)}
                            </div>
                            {invitation.status === "PENDING" && (
                              <div className="flex items-center text-yellow-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatExpiryDate(invitation.expiresAt)}
                              </div>
                            )}
                          </div>

                          {/* Message Preview */}
                          {invitation.message && (
                            <p className="text-muted-foreground line-clamp-2 text-sm">
                              {invitation.message}
                            </p>
                          )}

                          {/* Action Status */}
                          {invitation.status === "ACCEPTED" && (
                            <div className="flex items-center text-green-600 mt-2">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">
                                Accepted {formatTimeAgo(invitation.acceptedAt)}
                              </span>
                            </div>
                          )}
                          
                          {invitation.status === "DECLINED" && (
                            <div className="flex items-center text-red-600 mt-2">
                              <XCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">
                                Declined {formatTimeAgo(invitation.declinedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-2">
                        {invitation.status === "PENDING" && canRespondToInvitation(invitation) && (
                          <>
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedInvitation(invitation)
                                setShowAcceptModal(true)
                              }}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedInvitation(invitation)
                                setShowDeclineModal(true)
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInvitation(invitation)
                            setShowDetailModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
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