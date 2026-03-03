import React, { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  Building2, 
  Users, 
  Star,
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin,
  User,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  Share2,
  Heart,
  Bookmark,
  MessageSquare,
  UserPlus,
  Shield,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Check,
  X,
  Info
} from "lucide-react"

export default function JobseekerProfileViewPage() {
  const navigate = useNavigate()
  const { jobseekerId } = useParams()
  
  const [jobseeker, setJobseeker] = useState(null)
  const [company, setCompany] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showShareJobModal, setShowShareJobModal] = useState(false)
  const [showAddToChatModal, setShowAddToChatModal] = useState(false)
  const [showAddToVIChatModal, setShowAddToVIChatModal] = useState(false)
  const [inviteType, setInviteType] = useState("")
  const [selectedJob, setSelectedJob] = useState("")
  const [selectedChat, setSelectedChat] = useState("")
  const [isProfileVisible, setIsProfileVisible] = useState(true)

  // Mock company data
  const mockCompany = {
    id: "comp_001",
    name: "TechCorp Solutions",
    isVerified: true,
    isActive: true,
    isPremium: true,
    activeJobs: [
      { id: "job_001", title: "Senior React Developer", type: "Full-time", location: "San Francisco, CA", salary: "$120k - $180k" },
      { id: "job_002", title: "Frontend Intern", type: "Internship", location: "Remote", salary: "$25/hour" },
      { id: "job_003", title: "UI/UX Designer", type: "Part-time", location: "New York, NY", salary: "$80k - $120k" }
    ],
    jobChats: [
      { id: "chat_001", name: "Senior React Developer Chat", jobId: "job_001", jobTitle: "Senior React Developer" },
      { id: "chat_002", name: "Frontend Intern Chat", jobId: "job_002", jobTitle: "Frontend Intern" },
      { id: "chat_003", name: "UI/UX Designer Chat", jobId: "job_003", jobTitle: "UI/UX Designer" }
    ],
    viChat: { id: "vi_chat_001", name: "Virtual Intern Program Chat" }
  }

  // Mock jobseeker data
  const mockJobseeker = {
    id: "js_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    profileType: "EMPLOYABLE",
    experienceLevel: "senior",
    skills: ["React", "TypeScript", "Node.js", "AWS", "Docker", "GraphQL", "MongoDB", "PostgreSQL"],
    bio: "Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers. Led development teams at Google and various startups, delivering high-impact products used by millions of users.",
    education: [
      {
        institution: "Stanford University",
        degree: "Bachelor of Science in Computer Science",
        year: "2015",
        gpa: "3.9/4.0"
      }
    ],
    workExperience: [
      {
        title: "Senior Software Engineer",
        company: "Google",
        duration: "2020-2023",
        description: "Led development of internal tools and APIs used by 10,000+ engineers. Implemented microservices architecture that improved system reliability by 99.9%. Mentored 5 junior developers and conducted technical interviews.",
        achievements: ["Reduced API response time by 60%", "Led team of 8 developers", "Implemented CI/CD pipeline"]
      },
      {
        title: "Full-Stack Developer",
        company: "StartupXYZ",
        duration: "2017-2020",
        description: "Built and maintained customer-facing applications. Worked with React, Node.js, and AWS. Collaborated with design and product teams to deliver features.",
        achievements: ["Built MVP in 3 months", "Improved user retention by 40%", "Reduced bug reports by 50%"]
      }
    ],
    certifications: [
      "AWS Certified Solutions Architect",
      "Google Cloud Professional Developer",
      "React Advanced Certification",
      "Kubernetes Administrator"
    ],
    portfolio: "https://sarahjohnson.dev",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    github: "https://github.com/sarahjohnson",
    isPublic: true,
    isBlocked: false,
    rating: 4.8,
    totalReviews: 12,
    availability: "Available for new opportunities",
    preferredWorkType: ["Full-time", "Remote", "Hybrid"],
    salaryExpectation: "$150k - $200k",
    languages: ["English (Native)", "Spanish (Conversational)"],
    interests: ["Open Source", "Tech Mentoring", "AI/ML", "Blockchain"],
    lastActive: "2024-01-15T10:30:00Z"
  }

  useEffect(() => {
    // Simulate API call to get jobseeker and company data
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setJobseeker(mockJobseeker)
        setCompany(mockCompany)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [jobseekerId])

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
    
    // Show success message
    alert(`Invitation sent successfully to ${jobseeker.name} as ${inviteType === "EMPLOYABLE" ? "Employable" : "Virtual Intern"}!`)
  }

  const shareJobPost = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowShareJobModal(false)
    setSelectedJob("")
    
    // Show success message
    const selectedJobData = company.activeJobs.find(job => job.id === selectedJob)
    alert(`Job post "${selectedJobData.title}" shared successfully with ${jobseeker.name}!`)
  }

  const addToJobChat = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowAddToChatModal(false)
    setSelectedChat("")
    
    // Show success message
    const selectedChatData = company.jobChats.find(chat => chat.id === selectedChat)
    alert(`${jobseeker.name} added to ${selectedChatData.name}!`)
  }

  const addToVIChat = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowAddToVIChatModal(false)
    
    // Show success message
    alert(`${jobseeker.name} added to ${company.viChat.name}!`)
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

  const getExperienceLevelLabel = (level) => {
    const levels = {
      entry: "Entry Level (0-2 years)",
      mid: "Mid Level (3-5 years)",
      senior: "Senior Level (6+ years)",
      lead: "Lead/Manager"
    }
    return levels[level] || level
  }

  const getProfileTypeLabel = (type) => {
    const types = {
      EMPLOYABLE: "Employable",
      VIRTUAL_INTERN: "Virtual Intern"
    }
    return types[type] || type
  }

  // Access control check
  if (!company?.isVerified) {
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
                Your company account needs to be verified before you can view jobseeker profiles. 
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

  if (!company?.isActive) {
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
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!jobseeker) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-4">Profile Not Found</h1>
              <p className="text-lg text-muted-foreground mb-8">
                The jobseeker profile you're looking for doesn't exist or is not accessible.
              </p>
              <Button 
                onClick={() => navigate("/jobseekers")}
                className="w-full"
              >
                Back to Jobseekers
              </Button>
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => navigate("/jobseekers")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Jobseekers</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary">
                      {jobseeker.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    {/* Basic Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-3xl font-bold">{jobseeker.name}</h1>
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {getProfileTypeLabel(jobseeker.profileType)}
                        </Badge>
                      </div>
                      
                      <p className="text-xl text-muted-foreground mb-4">{jobseeker.bio}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{jobseeker.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Active {formatTimeAgo(jobseeker.lastActive)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{jobseeker.rating} ({jobseeker.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {jobseeker.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="px-3 py-1 text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Work Experience */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {jobseeker.workExperience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-primary/20 pl-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{exp.title}</h3>
                            <p className="text-muted-foreground">{exp.company}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {exp.duration}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{exp.description}</p>
                        {exp.achievements && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Key Achievements:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {exp.achievements.map((achievement, idx) => (
                                <li key={idx}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jobseeker.education.map((edu, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{edu.institution}</h3>
                        <p className="text-muted-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.year}</p>
                      </div>
                      {edu.gpa && (
                        <Badge variant="outline" className="text-xs">
                          GPA: {edu.gpa}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {jobseeker.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{jobseeker.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{jobseeker.phone}</span>
                  </div>
                  {jobseeker.portfolio && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={jobseeker.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Portfolio
                      </a>
                    </div>
                  )}
                  {jobseeker.linkedin && (
                    <div className="flex items-center space-x-3">
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={jobseeker.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {jobseeker.github && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={jobseeker.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        GitHub
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Experience Level</h4>
                    <Badge variant="outline">{getExperienceLevelLabel(jobseeker.experienceLevel)}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Availability</h4>
                    <p className="text-sm text-muted-foreground">{jobseeker.availability}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Preferred Work Type</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobseeker.preferredWorkType.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Salary Expectation</h4>
                    <p className="text-sm text-muted-foreground">{jobseeker.salaryExpectation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Languages</h4>
                    <div className="space-y-1">
                      {jobseeker.languages.map((lang, index) => (
                        <p key={index} className="text-sm text-muted-foreground">{lang}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobseeker.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Actions */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Engage with Candidate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Actions */}
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleInvite("EMPLOYABLE")}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Invite as Employable
                    </Button>
                    <Button 
                      onClick={() => handleInvite("VIRTUAL_INTERN")}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Invite as Virtual Intern
                    </Button>
                  </div>

                  {/* Premium Actions */}
                  {company.isPremium ? (
                    <div className="space-y-3">
                      <Button 
                        onClick={handleAddToJobChat}
                        disabled={company.jobChats.length === 0}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Add to Job Chat
                      </Button>
                      <Button 
                        onClick={handleAddToVIChat}
                        className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add to VI Chat
                      </Button>
                      <Button 
                        onClick={handleShareJob}
                        disabled={company.activeJobs.length === 0}
                        variant="outline"
                        className="w-full border-2 border-orange-500/50 hover:border-orange-500/70 hover:bg-orange-500/10"
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
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Invitation Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation to {jobseeker?.name} as {inviteType === "EMPLOYABLE" ? "an Employable candidate" : "a Virtual Intern"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Invitation Details:</h4>
              <p className="text-sm text-muted-foreground">
                • Type: {inviteType === "EMPLOYABLE" ? "Employable" : "Virtual Intern"}
              </p>
              <p className="text-sm text-muted-foreground">
                • Recipient: {jobseeker?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                • Company: {company?.name}
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
              Select a job post to share with {jobseeker?.name}.
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
                {company?.activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.type}) - {job.location}
                  </option>
                ))}
              </select>
            </div>
            {selectedJob && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Job Details:</h4>
                {(() => {
                  const job = company?.activeJobs.find(j => j.id === selectedJob)
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">• Title: {job?.title}</p>
                      <p className="text-sm text-muted-foreground">• Type: {job?.type}</p>
                      <p className="text-sm text-muted-foreground">• Location: {job?.location}</p>
                      <p className="text-sm text-muted-foreground">• Salary: {job?.salary}</p>
                      <p className="text-sm text-muted-foreground">• Recipient: {jobseeker?.name}</p>
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
              Select a job chat to add {jobseeker?.name} to.
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
                {company?.jobChats.map((chat) => (
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
                  const chat = company?.jobChats.find(c => c.id === selectedChat)
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">• Chat Name: {chat?.name}</p>
                      <p className="text-sm text-muted-foreground">• Job Title: {chat?.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">• Participant: {jobseeker?.name}</p>
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
              Add {jobseeker?.name} to your Virtual Intern program chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">VI Chat Details:</h4>
              <p className="text-sm text-muted-foreground">• Chat Name: {company?.viChat.name}</p>
              <p className="text-sm text-muted-foreground">• Company: {company?.name}</p>
              <p className="text-sm text-muted-foreground">• Participant: {jobseeker?.name}</p>
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