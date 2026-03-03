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
  Building2, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Archive,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  MessageCircle,
  UserPlus,
  TrendingUp
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"

export default function MyJobPostsPage() {
  const navigate = useNavigate()
  const [jobPosts, setJobPosts] = useState([])
  const [filteredJobPosts, setFilteredJobPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [forceDelete, setForceDelete] = useState(false)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  // Mock company data
  const [companyProfile] = useState({
    id: "comp_001",
    name: "TechCorp Solutions",
    isVerified: true,
    isActive: true
  })

  // Mock job posts data
  const mockJobPosts = [
    {
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
      applications: 12,
      views: 156,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      hasChat: true,
      chatThreadId: "chat_001",
      skills: ["React", "TypeScript", "Node.js", "AWS"]
    },
    {
      id: "job_002",
      title: "Frontend Intern",
      description: "Join our internship program and gain real-world experience...",
      category: "Software Development",
      jobType: "VIRTUAL_INTERN",
      location: "Remote",
      locationType: "remote",
      experienceLevel: "entry",
      salary: { min: 3000, max: 5000, currency: "USD" },
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      applications: 8,
      views: 89,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      hasChat: false,
      skills: ["JavaScript", "React", "HTML", "CSS"]
    },
    {
      id: "job_003",
      title: "UI/UX Designer",
      description: "Create beautiful and intuitive user experiences...",
      category: "Design & Creative",
      jobType: "PART_TIME",
      location: "New York, NY",
      locationType: "onsite",
      experienceLevel: "mid",
      salary: { min: 80000, max: 120000, currency: "USD" },
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "EXPIRED",
      applications: 15,
      views: 234,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      hasChat: true,
      chatThreadId: "chat_002",
      skills: ["Figma", "Adobe Creative Suite", "UI/UX Design", "Prototyping"]
    },
    {
      id: "job_004",
      title: "Data Scientist",
      description: "Analyze complex data sets and drive business insights...",
      category: "Data & Analytics",
      jobType: "FULL_TIME",
      location: "Austin, TX",
      locationType: "hybrid",
      experienceLevel: "senior",
      salary: { min: 130000, max: 190000, currency: "USD" },
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      applications: 0,
      views: 23,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      hasChat: false,
      skills: ["Python", "Machine Learning", "SQL", "Statistics"]
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobPosts(mockJobPosts)
      setFilteredJobPosts(mockJobPosts)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = jobPosts.filter(job => {
      // Search query
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (selectedStatus && job.status !== selectedStatus) {
        return false
      }

      return true
    })

    setFilteredJobPosts(filtered)
  }, [jobPosts, searchQuery, selectedStatus])

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStatus("")
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
      ACTIVE: { color: "green", label: "Active", icon: CheckCircle },
      EXPIRED: { color: "yellow", label: "Expired", icon: Clock },
      ARCHIVED: { color: "gray", label: "Archived", icon: Archive },
      DRAFT: { color: "blue", label: "Draft", icon: AlertCircle }
    }

    const config = statusConfig[status] || statusConfig.ACTIVE
    const Icon = config.icon

    const colorClasses = {
      green: "bg-green-50 border-green-200 text-green-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      gray: "bg-gray-50 border-gray-200 text-gray-700",
      blue: "bg-blue-50 border-blue-200 text-blue-700"
    }

    return (
      <Badge variant="outline" className={colorClasses[config.color]}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getJobTypeBadge = (type) => {
    const typeConfig = {
      FULL_TIME: { label: "Full-time", color: "default" },
      PART_TIME: { label: "Part-time", color: "secondary" },
      VIRTUAL_INTERN: { label: "Virtual Intern", color: "outline" }
    }

    const config = typeConfig[type] || typeConfig.FULL_TIME

    return (
      <Badge variant={config.color}>
        {config.label}
      </Badge>
    )
  }

  const handleEdit = (job) => {
    setSelectedJob(job)
    setShowEditModal(true)
  }

  const handleDelete = (job) => {
    setSelectedJob(job)
    setShowDeleteModal(true)
    setDeleteConfirmation("")
    setForceDelete(false)
  }

  const confirmDelete = async () => {
    if (selectedJob.applications > 0 && !forceDelete) {
      alert("This job has applicants. Please check the 'Force Delete' option to proceed.")
      return
    }

    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update job status to ARCHIVED
    setJobPosts(prev => prev.map(job => 
      job.id === selectedJob.id 
        ? { ...job, status: "ARCHIVED" }
        : job
    ))
    
    setShowDeleteModal(false)
    setSelectedJob(null)
    setDeleteConfirmation("")
    setForceDelete(false)
    setIsProcessing(false)
    
    // Show success message
    alert(`Job post "${selectedJob.title}" has been archived successfully!`)
  }

  const canEditJob = (job) => {
    return job.status === "ACTIVE" || job.status === "DRAFT"
  }

  const canDeleteJob = (job) => {
    return job.status !== "ARCHIVED"
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
                Your company account needs to be verified before you can manage job posts. 
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
            <p className="text-muted-foreground">Loading your job posts...</p>
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
                onClick={() => navigate("/dashboard/company")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                onClick={() => navigate("/post-job")}
                className="bg-gradient-to-r from-primary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Create New Job Post
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary/80 bg-clip-text text-transparent mb-3">
              My Job Posts
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage and track your job postings
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Company
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredJobPosts.length} job posts found
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
                    placeholder="Search job posts by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-secondary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="ARCHIVED">Archived</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Job Posts Table */}
          {filteredJobPosts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Job Posts Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedStatus 
                    ? "Try adjusting your search criteria or filters to find more job posts."
                    : "You haven't created any job posts yet. Start by creating your first job posting."
                  }
                </p>
                {!searchQuery && !selectedStatus && (
                  <Button 
                    onClick={() => navigate("/post-job")}
                    className="bg-gradient-to-r from-primay to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Create Your First Job Post
                  </Button>
                )}
                {(searchQuery || selectedStatus) && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobPosts.map((job) => (
                <Card 
                  key={job.id} 
                  className="group hover:shadow-xl transition-all duration-500 border-2 border-border/50 hover:border-secondary/30"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                {job.title}
                              </h3>
                              {getStatusBadge(job.status)}
                              {getJobTypeBadge(job.jobType)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.location} ({job.locationType})
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Posted {formatTimeAgo(job.createdAt)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Expires {formatDate(job.deadline)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-secondary">{job.applications}</div>
                            <div className="text-sm text-muted-foreground">Applications</div>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-secondary">{job.views}</div>
                            <div className="text-sm text-muted-foreground">Views</div>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-secondary">
                              {job.salary.min ? `$${job.salary.min.toLocaleString()}` : "Not specified"}
                            </div>
                            <div className="text-sm text-muted-foreground">Min Salary</div>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-secondary">
                              {job.hasChat ? "Enabled" : "Disabled"}
                            </div>
                            <div className="text-sm text-muted-foreground">Chat Area</div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.skills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => navigate(`/job-posts/${job.id}/applicants`)}
                          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Manage Applicants ({job.applications})
                        </Button>
                        
                        {canEditJob(job) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(job)}
                            className="flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {canDeleteJob(job) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(job)}
                            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">
              Delete Job Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold mb-2 text-red-700">Job Post Details:</h4>
                <div className="space-y-1 text-sm text-red-600">
                  <p>• Title: {selectedJob.title}</p>
                  <p>• Status: {selectedJob.status}</p>
                  <p>• Applications: {selectedJob.applications}</p>
                  <p>• Views: {selectedJob.views}</p>
                </div>
              </div>

              {selectedJob.applications > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-700 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Warning: This job has {selectedJob.applications} applicants</span>
                  </div>
                  <ul className="space-y-1 text-sm text-yellow-600">
                    <li>• Applicants will be notified of the job closure</li>
                    <li>• Chat threads will be archived (not deleted)</li>
                    <li>• Application data will be retained for compliance</li>
                  </ul>
                  <div className="mt-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={forceDelete}
                        onChange={(e) => setForceDelete(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-yellow-700">
                        I understand this action will notify {selectedJob.applications} applicants
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">What happens when you delete:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Job post will be marked as "Archived"</li>
                  <li>• Job will no longer be visible to jobseekers</li>
                  <li>• Chat area will be disabled (messages preserved)</li>
                  <li>• Application data will be retained</li>
                  {selectedJob.applications > 0 && (
                    <li>• Applicants will receive notification</li>
                  )}
                </ul>
              </div>

              <div>
                <Label htmlFor="delete-confirmation" className="text-sm font-semibold">
                  Type "DELETE" to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  type="text"
                  placeholder="Type DELETE to confirm..."
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isProcessing || deleteConfirmation !== "DELETE" || (selectedJob?.applications > 0 && !forceDelete)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Job Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 