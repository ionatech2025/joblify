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
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin,
  User,
  Building2,
  Send,
  Eye,
  Filter,
  Users,
  Calendar,
  Award,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"

export default function JobseekersListingPage() {
  const navigate = useNavigate()
  const [jobseekers, setJobseekers] = useState([])
  const [filteredJobseekers, setFilteredJobseekers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJobseeker, setSelectedJobseeker] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showShareJobModal, setShowShareJobModal] = useState(false)
  const [showAddToChatModal, setShowAddToChatModal] = useState(false)
  const [showAddToVIChatModal, setShowAddToVIChatModal] = useState(false)
  const [inviteType, setInviteType] = useState("")
  const [selectedJob, setSelectedJob] = useState("")
  const [selectedChat, setSelectedChat] = useState("")
  const [isPremium, setIsPremium] = useState(true) // Mock premium status
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedProfileType, setSelectedProfileType] = useState("")
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState("")

  // Mock company data
  const [companyProfile] = useState({
    id: "comp_001",
    name: "TechCorp Solutions",
    isVerified: true,
    isActive: true,
    isPremium: true,
    activeJobs: [
      { id: "job_001", title: "Senior React Developer", type: "Full-time" },
      { id: "job_002", title: "Frontend Intern", type: "Internship" },
      { id: "job_003", title: "UI/UX Designer", type: "Part-time" }
    ],
    jobChats: [
      { id: "chat_001", name: "Senior React Developer Chat", jobId: "job_001", jobTitle: "Senior React Developer" },
      { id: "chat_002", name: "Frontend Intern Chat", jobId: "job_002", jobTitle: "Frontend Intern" },
      { id: "chat_003", name: "UI/UX Designer Chat", jobId: "job_003", jobTitle: "UI/UX Designer" }
    ],
    viChat: { id: "vi_chat_001", name: "Virtual Intern Program Chat" }
  })

  // Available filters
  const skills = [
    "React", "JavaScript", "Python", "Java", "Node.js", "TypeScript", 
    "Vue.js", "Angular", "PHP", "Ruby", "Go", "C++", "C#", "Swift",
    "Kotlin", "Flutter", "React Native", "AWS", "Docker", "Kubernetes",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST API"
  ]

  const locations = [
    "New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA",
    "Boston, MA", "Chicago, IL", "Denver, CO", "Los Angeles, CA",
    "Remote", "Hybrid", "On-site"
  ]

  const profileTypes = [
    { value: "EMPLOYABLE", label: "Employable" },
    { value: "VIRTUAL_INTERN", label: "Virtual Intern" }
  ]

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6+ years)" },
    { value: "lead", label: "Lead/Manager" }
  ]

  // Mock jobseeker data
  const mockJobseekers = [
    {
      id: "js_001",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      profileType: "EMPLOYABLE",
      experienceLevel: "senior",
      skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
      bio: "Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Passionate about clean code and user experience.",
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
        },
        {
          title: "Full-Stack Developer",
          company: "StartupXYZ",
          duration: "2017-2020",
          description: "Built and maintained customer-facing applications"
        }
      ],
      certifications: [
        "AWS Certified Solutions Architect",
        "Google Cloud Professional Developer"
      ],
      portfolio: "https://sarahjohnson.dev",
      linkedin: "https://linkedin.com/in/sarahjohnson",
      isPublic: true,
      isBlocked: false,
      rating: 4.8,
      totalReviews: 12
    },
    {
      id: "js_002",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 234-5678",
      location: "New York, NY",
      profileType: "VIRTUAL_INTERN",
      experienceLevel: "entry",
      skills: ["Python", "JavaScript", "React", "MongoDB"],
      bio: "Recent Computer Science graduate eager to learn and contribute to innovative projects. Strong foundation in web development and data analysis.",
      education: [
        {
          institution: "MIT",
          degree: "Bachelor of Science in Computer Science",
          year: "2023"
        }
      ],
      workExperience: [],
      certifications: ["Python Programming Certificate"],
      portfolio: "https://michaelchen.dev",
      linkedin: "https://linkedin.com/in/michaelchen",
      isPublic: true,
      isBlocked: false,
      rating: 4.5,
      totalReviews: 5
    },
    {
      id: "js_003",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 345-6789",
      location: "Austin, TX",
      profileType: "EMPLOYABLE",
      experienceLevel: "mid",
      skills: ["Vue.js", "JavaScript", "PHP", "MySQL", "Laravel"],
      bio: "Mid-level developer with 4 years of experience in modern web technologies. Specialized in Vue.js and PHP development.",
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
      isPublic: true,
      isBlocked: false,
      rating: 4.7,
      totalReviews: 8
    },
    {
      id: "js_004",
      name: "David Kim",
      email: "david.kim@email.com",
      phone: "+1 (555) 456-7890",
      location: "Seattle, WA",
      profileType: "VIRTUAL_INTERN",
      experienceLevel: "entry",
      skills: ["Java", "Spring Boot", "React", "PostgreSQL"],
      bio: "Computer Science student with strong interest in backend development and system design. Looking for internship opportunities.",
      education: [
        {
          institution: "University of Washington",
          degree: "Bachelor of Science in Computer Science",
          year: "2024 (Expected)"
        }
      ],
      workExperience: [],
      certifications: ["Java Programming Certificate"],
      portfolio: "https://davidkim.dev",
      linkedin: "https://linkedin.com/in/davidkim",
      isPublic: true,
      isBlocked: false,
      rating: 4.3,
      totalReviews: 3
    },
    {
      id: "js_005",
      name: "Lisa Thompson",
      email: "lisa.thompson@email.com",
      phone: "+1 (555) 567-8901",
      location: "Boston, MA",
      profileType: "EMPLOYABLE",
      experienceLevel: "lead",
      skills: ["React", "TypeScript", "Node.js", "AWS", "Kubernetes", "GraphQL"],
      bio: "Technical Lead with 10+ years of experience in software development. Expert in React ecosystem and cloud architecture.",
      education: [
        {
          institution: "Harvard University",
          degree: "Master of Science in Computer Science",
          year: "2013"
        }
      ],
      workExperience: [
        {
          title: "Technical Lead",
          company: "Microsoft",
          duration: "2018-2023",
          description: "Led development teams and architectural decisions"
        },
        {
          title: "Senior Developer",
          company: "Amazon",
          duration: "2013-2018",
          description: "Developed scalable web services and APIs"
        }
      ],
      certifications: [
        "AWS Certified Solutions Architect",
        "Kubernetes Administrator",
        "React Advanced Certification"
      ],
      portfolio: "https://lisathompson.dev",
      linkedin: "https://linkedin.com/in/lisathompson",
      isPublic: true,
      isBlocked: false,
      rating: 4.9,
      totalReviews: 18
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobseekers(mockJobseekers)
      setFilteredJobseekers(mockJobseekers)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = jobseekers.filter(jobseeker => {
      // Search query
      if (searchQuery && !jobseeker.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !jobseeker.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }

      // Skills filter
      if (selectedSkills.length > 0 && !selectedSkills.some(skill => jobseeker.skills.includes(skill))) {
        return false
      }

      // Location filter
      if (selectedLocation && jobseeker.location !== selectedLocation) {
        return false
      }

      // Profile type filter
      if (selectedProfileType && jobseeker.profileType !== selectedProfileType) {
        return false
      }

      // Experience level filter
      if (selectedExperienceLevel && jobseeker.experienceLevel !== selectedExperienceLevel) {
        return false
      }

      return true
    })

    setFilteredJobseekers(filtered)
    setCurrentPage(1)
  }, [jobseekers, searchQuery, selectedSkills, selectedLocation, selectedProfileType, selectedExperienceLevel])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentJobseekers = filteredJobseekers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredJobseekers.length / itemsPerPage)

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSkills([])
    setSelectedLocation("")
    setSelectedProfileType("")
    setSelectedExperienceLevel("")
  }

  const handleInvite = (type) => {
    setInviteType(type)
    setShowInviteModal(true)
  }

  const handleShareJob = () => {
    setShowShareJobModal(true)
  }

  const handleAddToJobChat = () => {
    setShowAddToChatModal(true)
  }

  const handleAddToVIChat = () => {
    setShowAddToVIChatModal(true)
  }

  const sendInvitation = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowInviteModal(false)
    setInviteType("")
    setSelectedJobseeker(null)
    
    // Show success message
    alert(`Invitation sent successfully to ${selectedJobseeker.name} as ${inviteType === "EMPLOYABLE" ? "Employable" : "Virtual Intern"}!`)
  }

  const shareJobPost = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowShareJobModal(false)
    setSelectedJob("")
    setSelectedJobseeker(null)
    
    // Show success message
    const selectedJobData = companyProfile.activeJobs.find(job => job.id === selectedJob)
    alert(`Job post "${selectedJobData.title}" shared successfully with ${selectedJobseeker.name}!`)
  }

  const addToJobChat = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowAddToChatModal(false)
    setSelectedChat("")
    setSelectedJobseeker(null)
    
    // Show success message
    const selectedChatData = companyProfile.jobChats.find(chat => chat.id === selectedChat)
    alert(`${selectedJobseeker.name} added to ${selectedChatData.name}!`)
  }

  const addToVIChat = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowAddToVIChatModal(false)
    setSelectedJobseeker(null)
    
    // Show success message
    alert(`${selectedJobseeker.name} added to ${companyProfile.viChat.name}!`)
  }

  const getExperienceLevelLabel = (level) => {
    const exp = experienceLevels.find(e => e.value === level)
    return exp ? exp.label : level
  }

  const getProfileTypeLabel = (type) => {
    const profileType = profileTypes.find(p => p.value === type)
    return profileType ? profileType.label : type
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
                Your company account needs to be verified before you can browse jobseeker profiles. 
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
            <p className="text-muted-foreground">Loading jobseekers...</p>
          </div>
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
                onClick={() => navigate("/dashboard/company")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Browse Jobseekers
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover talented professionals and invite them to join your team
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Company
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredJobseekers.length} jobseekers found
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
                    placeholder="Search jobseekers by name, skills, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Skills Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Skills</Label>
                    <select
                      value=""
                      onChange={(e) => e.target.value && handleSkillToggle(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">Select Skills</option>
                      {skills.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSkills.map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => handleSkillToggle(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Location</Label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Locations</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profile Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Profile Type</Label>
                    <select
                      value={selectedProfileType}
                      onChange={(e) => setSelectedProfileType(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Types</option>
                      {profileTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Level Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Experience Level</Label>
                    <select
                      value={selectedExperienceLevel}
                      onChange={(e) => setSelectedExperienceLevel(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Levels</option>
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
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
                    {filteredJobseekers.length} of {jobseekers.length} jobseekers
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Jobseekers Grid */}
          {currentJobseekers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Jobseekers Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters to find more jobseekers.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentJobseekers.map((jobseeker) => (
                <Card 
                  key={jobseeker.id} 
                  className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30"
                  onClick={() => {
                    setSelectedJobseeker(jobseeker)
                    setShowProfileModal(true)
                  }}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {jobseeker.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={jobseeker.profileType === "EMPLOYABLE" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {getProfileTypeLabel(jobseeker.profileType)}
                            </Badge>
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs ml-1">{jobseeker.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location and Experience */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="text-sm">{jobseeker.location}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span className="text-sm">{getExperienceLevelLabel(jobseeker.experienceLevel)}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Top Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobseeker.skills.slice(0, 3).map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="outline" 
                            className="text-xs px-2 py-1"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {jobseeker.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{jobseeker.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bio Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {jobseeker.bio}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/jobseekers/${jobseeker.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Full Profile
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedJobseeker(jobseeker)
                          setShowProfileModal(true)
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Quick Actions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10 p-0"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Profile Detail Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedJobseeker?.name}'s Profile
            </DialogTitle>
            <DialogDescription>
              View detailed information and take action
            </DialogDescription>
          </DialogHeader>

          {selectedJobseeker && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedJobseeker.name}</h2>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge 
                        variant={selectedJobseeker.profileType === "EMPLOYABLE" ? "default" : "secondary"}
                      >
                        {getProfileTypeLabel(selectedJobseeker.profileType)}
                      </Badge>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1">{selectedJobseeker.rating}</span>
                        <span className="text-muted-foreground ml-1">({selectedJobseeker.totalReviews} reviews)</span>
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
                    <span>{selectedJobseeker.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{selectedJobseeker.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{selectedJobseeker.location}</span>
                  </div>
                  {selectedJobseeker.portfolio && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a 
                        href={selectedJobseeker.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Portfolio
                      </a>
                    </div>
                  )}
                  {selectedJobseeker.linkedin && (
                    <div className="flex items-center">
                      <Linkedin className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a 
                        href={selectedJobseeker.linkedin} 
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

              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{selectedJobseeker.bio}</p>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobseeker.skills.map((skill) => (
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
                  {selectedJobseeker.education.map((edu, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <h4 className="font-semibold">{edu.institution}</h4>
                      <p className="text-muted-foreground">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">{edu.year}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Work Experience */}
              {selectedJobseeker.workExperience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedJobseeker.workExperience.map((exp, index) => (
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

              {/* Certifications */}
              {selectedJobseeker.certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedJobseeker.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 pt-4 border-t">
                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => handleInvite("EMPLOYABLE")}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Invite as Employable
                  </Button>
                  <Button 
                    onClick={() => handleInvite("VIRTUAL_INTERN")}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Invite as Virtual Intern
                  </Button>
                </div>

                {/* Premium Actions */}
                {companyProfile.isPremium ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleAddToJobChat}
                      disabled={companyProfile.jobChats.length === 0}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Add to Job Chat
                    </Button>
                    <Button 
                      onClick={handleAddToVIChat}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add to VI Chat
                    </Button>
                    <Button 
                      onClick={handleShareJob}
                      disabled={companyProfile.activeJobs.length === 0}
                      variant="outline"
                      className="flex-1 border-2 border-orange-500/50 hover:border-orange-500/70 hover:bg-orange-500/10"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Share Job Post
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Premium Features</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      Upgrade to Premium to access chat features and direct job sharing.
                    </p>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invitation Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation to {selectedJobseeker?.name} as {inviteType === "EMPLOYABLE" ? "an Employable candidate" : "a Virtual Intern"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Invitation Details:</h4>
              <p className="text-sm text-muted-foreground">
                • Type: {inviteType === "EMPLOYABLE" ? "Employable" : "Virtual Intern"}
              </p>
              <p className="text-sm text-muted-foreground">
                • Recipient: {selectedJobseeker?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                • Company: {companyProfile.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The jobseeker will receive a notification and can choose to accept or decline your invitation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvitation}>
              <Send className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Job Modal */}
      <Dialog open={showShareJobModal} onOpenChange={setShowShareJobModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Job Post</DialogTitle>
            <DialogDescription>
              Select a job post to share with {selectedJobseeker?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-select" className="text-sm font-semibold">Select Job Post</Label>
              <select
                id="job-select"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 mt-2"
              >
                <option value="">Choose a job post...</option>
                {companyProfile.activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.type})
                  </option>
                ))}
              </select>
            </div>
            {selectedJob && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Job Details:</h4>
                {(() => {
                  const job = companyProfile.activeJobs.find(j => j.id === selectedJob)
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">• Title: {job?.title}</p>
                      <p className="text-sm text-muted-foreground">• Type: {job?.type}</p>
                      <p className="text-sm text-muted-foreground">• Recipient: {selectedJobseeker?.name}</p>
                    </>
                  )
                })()}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              The jobseeker will receive a notification with the job details and can apply directly.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareJobModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={shareJobPost}
              disabled={!selectedJob}
            >
              <Send className="w-4 h-4 mr-2" />
              Share Job Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Job Chat Modal */}
      <Dialog open={showAddToChatModal} onOpenChange={setShowAddToChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Job Chat</DialogTitle>
            <DialogDescription>
              Select a job chat to add {selectedJobseeker?.name} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-select" className="text-sm font-semibold">Select Job Chat</Label>
              <select
                id="chat-select"
                value={selectedChat}
                onChange={(e) => setSelectedChat(e.target.value)}
                className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 mt-2"
              >
                <option value="">Choose a job chat...</option>
                {companyProfile.jobChats.map((chat) => (
                  <option key={chat.id} value={chat.id}>
                    {chat.name} ({chat.jobTitle})
                  </option>
                ))}
              </select>
            </div>
            {selectedChat && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Chat Details:</h4>
                {(() => {
                  const chat = companyProfile.jobChats.find(c => c.id === selectedChat)
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">• Chat Name: {chat?.name}</p>
                      <p className="text-sm text-muted-foreground">• Job Title: {chat?.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">• Participant: {selectedJobseeker?.name}</p>
                    </>
                  )
                })()}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              The jobseeker will be added to the selected chat and receive a notification.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToChatModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addToJobChat}
              disabled={!selectedChat}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Add to Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to VI Chat Modal */}
      <Dialog open={showAddToVIChatModal} onOpenChange={setShowAddToVIChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Virtual Intern Chat</DialogTitle>
            <DialogDescription>
              Add {selectedJobseeker?.name} to your Virtual Intern program chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">VI Chat Details:</h4>
              <p className="text-sm text-muted-foreground">• Chat Name: {companyProfile.viChat.name}</p>
              <p className="text-sm text-muted-foreground">• Company: {companyProfile.name}</p>
              <p className="text-sm text-muted-foreground">• Participant: {selectedJobseeker?.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              The jobseeker will be added to your Virtual Intern program chat and receive a notification.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToVIChatModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addToVIChat}
            >
              <Users className="w-4 h-4 mr-2" />
              Add to VI Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
} 