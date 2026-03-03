"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
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
  MessageCircle, 
  Crown, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  X,
  Eye,
  Share2,
  Save,
  Send,
  Clock,
  DollarSign,
  GraduationCap,
  Target,
  Globe,
  Home,
  Zap,
  Sparkles
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"
import { Footer } from "../components/Footer"

export default function PostJobPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [createdJobId, setCreatedJobId] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    jobType: "",
    skills: [],
    experienceLevel: "",
    location: "",
    locationType: "",
    salary: {
      min: "",
      max: "",
      currency: "USD"
    },
    deadline: "",
    hasChat: false,
    requirements: "",
    benefits: "",
    responsibilities: ""
  })

  // Validation states
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Mock company data
  const [companyProfile] = useState({
    id: "comp_001",
    name: "TechCorp Solutions",
    isVerified: true,
    isActive: true,
    hasCreateJobPermission: true,
    isPremium: true,
    premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    activeJobs: [
      { id: "job_001", title: "Senior React Developer" },
      { id: "job_002", title: "Frontend Intern" }
    ]
  })

  // Available options
  const categories = [
    "Software Development",
    "Design & Creative",
    "Marketing & Sales",
    "Data & Analytics",
    "Product Management",
    "Customer Support",
    "Human Resources",
    "Finance & Accounting",
    "Operations",
    "Legal",
    "Healthcare",
    "Education",
    "Other"
  ]

  const jobTypes = [
    { value: "FULL_TIME", label: "Full-time", icon: Briefcase },
    { value: "PART_TIME", label: "Part-time", icon: Clock },
    { value: "VIRTUAL_INTERN", label: "Virtual Intern", icon: GraduationCap }
  ]

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6+ years)" },
    { value: "lead", label: "Lead/Manager" }
  ]

  const locationTypes = [
    { value: "onsite", label: "On-site", icon: Building2 },
    { value: "remote", label: "Remote", icon: Globe },
    { value: "hybrid", label: "Hybrid", icon: Home }
  ]

  const commonSkills = [
    "React", "JavaScript", "TypeScript", "Node.js", "Python", "Java", "C++", "C#",
    "Vue.js", "Angular", "PHP", "Ruby", "Go", "Swift", "Kotlin", "Flutter",
    "AWS", "Docker", "Kubernetes", "MongoDB", "PostgreSQL", "MySQL", "Redis",
    "GraphQL", "REST API", "Git", "CI/CD", "Agile", "Scrum", "UI/UX Design",
    "Adobe Creative Suite", "Figma", "Sketch", "SEO", "Google Analytics",
    "Salesforce", "HubSpot", "Excel", "PowerPoint", "Word"
  ]

  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "CAD", label: "CAD (C$)" },
    { value: "AUD", label: "AUD (A$)" }
  ]

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const handleSalaryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }))
  }

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const addCustomSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
  }

  // Validation function
  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = "Job title is required"
    } else if (formData.title.length < 5) {
      newErrors.title = "Job title must be at least 5 characters"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required"
    } else if (formData.description.length < 50) {
      newErrors.description = "Job description must be at least 50 characters"
    }

    if (!formData.category) {
      newErrors.category = "Please select a category"
    }

    if (!formData.jobType) {
      newErrors.jobType = "Please select a job type"
    }

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = "Please select experience level"
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required"
    }

    if (!formData.locationType) {
      newErrors.locationType = "Please select location type"
    }

    if (!formData.deadline) {
      newErrors.deadline = "Application deadline is required"
    } else {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deadlineDate <= today) {
        newErrors.deadline = "Deadline must be a future date"
      }
    }

    // Check for duplicate job titles
    const isDuplicate = companyProfile.activeJobs.some(
      job => job.title.toLowerCase() === formData.title.toLowerCase()
    )
    if (isDuplicate) {
      newErrors.title = "You already have an active job post with this title"
    }

    // Skills validation
    if (formData.skills.length === 0) {
      newErrors.skills = "Please select at least one skill"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate mock job ID
    const jobId = `job_${Date.now()}`
    setCreatedJobId(jobId)
    
    setIsProcessing(false)
    setShowSuccessModal(true)
  }

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreviewModal(true)
    }
  }

  const handleChatToggle = () => {
    if (!companyProfile.isPremium) {
      setShowUpgradeModal(true)
      return
    }
    
    setFormData(prev => ({
      ...prev,
      hasChat: !prev.hasChat
    }))
  }

  const handleSaveDraft = async () => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsProcessing(false)
    alert("Draft saved successfully!")
  }

  // Access control check
  if (!companyProfile.isVerified) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-4">Access Restricted</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your company account needs to be verified before you can post jobs. 
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

  if (!companyProfile.hasCreateJobPermission) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-blue-600 mb-4">Permission Required</h1>
              <p className="text-lg text-muted-foreground mb-8">
                You don't have permission to create job posts. Please contact your company administrator.
              </p>
              <Button 
                onClick={() => navigate("/login")}
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent mb-3">
              Create Job Post
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Attract top talent by creating a compelling job posting
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Company
              </Badge>
              {companyProfile.isPremium && (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>

          {/* Job Post Form */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Job Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Job Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="e.g., Senior React Developer"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={`mt-2 h-12 text-lg rounded-xl border-2 transition-all duration-300 ${
                        errors.title && touched.title 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                          : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.title && touched.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category" className="text-sm font-semibold">
                      Category *
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className={`w-full mt-2 p-3 border-2 rounded-xl transition-all duration-300 ${
                        errors.category && touched.category 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                          : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && touched.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {/* Job Type */}
                  <div>
                    <Label className="text-sm font-semibold">Job Type *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {jobTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <label
                            key={type.value}
                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                              formData.jobType === type.value
                                ? "border-secondary bg-secondary/10"
                                : "border-border/50 hover:border-secondary/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name="jobType"
                              value={type.value}
                              checked={formData.jobType === type.value}
                              onChange={(e) => handleInputChange("jobType", e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5 text-secondary" />
                              <span className="font-medium">{type.label}</span>
                            </div>
                            {formData.jobType === type.value && (
                              <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-secondary" />
                            )}
                          </label>
                        )
                      })}
                    </div>
                    {errors.jobType && touched.jobType && (
                      <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Job Description *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className={`mt-2 min-h-32 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.description && touched.description 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                          : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.description && touched.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Experience Level */}
                  <div>
                    <Label htmlFor="experienceLevel" className="text-sm font-semibold">
                      Experience Level *
                    </Label>
                    <select
                      id="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                      className={`w-full mt-2 p-3 border-2 rounded-xl transition-all duration-300 ${
                        errors.experienceLevel && touched.experienceLevel 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                          : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      }`}
                    >
                      <option value="">Select experience level</option>
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    {errors.experienceLevel && touched.experienceLevel && (
                      <p className="text-red-500 text-sm mt-1">{errors.experienceLevel}</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <Label className="text-sm font-semibold">Required Skills *</Label>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.skills.map((skill) => (
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {commonSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillToggle(skill)}
                            className={`p-2 text-sm rounded-lg border transition-all duration-300 ${
                              formData.skills.includes(skill)
                                ? "bg-secondary text-white border-secondary"
                                : "bg-white border-border/50 hover:border-secondary/30"
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Input
                          type="text"
                          placeholder="Add custom skill..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomSkill(e.target.value)
                              e.target.value = ""
                            }
                          }}
                          className="h-10 rounded-lg border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                        />
                      </div>
                    </div>
                    {errors.skills && (
                      <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-sm font-semibold">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="e.g., San Francisco, CA"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className={`mt-2 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.location && touched.location 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                            : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                        }`}
                      />
                      {errors.location && touched.location && (
                        <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Location Type *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {locationTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <label
                              key={type.value}
                              className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-300 ${
                                formData.locationType === type.value
                                  ? "border-secondary bg-secondary/10"
                                  : "border-border/50 hover:border-secondary/30"
                              }`}
                            >
                              <input
                                type="radio"
                                name="locationType"
                                value={type.value}
                                checked={formData.locationType === type.value}
                                onChange={(e) => handleInputChange("locationType", e.target.value)}
                                className="sr-only"
                              />
                              <div className="text-center">
                                <Icon className="w-4 h-4 mx-auto mb-1 text-secondary" />
                                <span className="text-xs font-medium">{type.label}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                      {errors.locationType && touched.locationType && (
                        <p className="text-red-500 text-sm mt-1">{errors.locationType}</p>
                      )}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <Label className="text-sm font-semibold">Salary Range (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Min salary"
                          value={formData.salary.min}
                          onChange={(e) => handleSalaryChange("min", e.target.value)}
                          className="h-12 rounded-xl border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Max salary"
                          value={formData.salary.max}
                          onChange={(e) => handleSalaryChange("max", e.target.value)}
                          className="h-12 rounded-xl border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                        />
                      </div>
                      <div>
                        <select
                          value={formData.salary.currency}
                          onChange={(e) => handleSalaryChange("currency", e.target.value)}
                          className="w-full h-12 p-3 border-2 border-border/50 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                        >
                          {currencies.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="requirements" className="text-sm font-semibold">
                        Requirements
                      </Label>
                      <Textarea
                        id="requirements"
                        placeholder="List specific requirements, qualifications, or certifications..."
                        value={formData.requirements}
                        onChange={(e) => handleInputChange("requirements", e.target.value)}
                        className="mt-2 min-h-24 rounded-xl border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="benefits" className="text-sm font-semibold">
                        Benefits
                      </Label>
                      <Textarea
                        id="benefits"
                        placeholder="List benefits, perks, and what makes your company great..."
                        value={formData.benefits}
                        onChange={(e) => handleInputChange("benefits", e.target.value)}
                        className="mt-2 min-h-24 rounded-xl border-2 border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Settings */}
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Application Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Deadline */}
                  <div>
                    <Label htmlFor="deadline" className="text-sm font-semibold">
                      Application Deadline *
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`mt-2 h-12 rounded-xl border-2 transition-all duration-300 ${
                        errors.deadline && touched.deadline 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                          : "border-border/50 focus:border-secondary/50 focus:ring-secondary/20"
                      }`}
                    />
                    {errors.deadline && touched.deadline && (
                      <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
                    )}
                  </div>

                  {/* Chat Area Toggle */}
                  <div className="flex items-center justify-between p-4 border-2 border-border/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.hasChat 
                          ? "bg-secondary/20 text-secondary" 
                          : "bg-muted/50 text-muted-foreground"
                      }`}>
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Create Chat Area for Applicants</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable real-time communication between applicants and your team
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!companyProfile.isPremium && (
                        <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={handleChatToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.hasChat ? "bg-secondary" : "bg-muted"
                        } ${!companyProfile.isPremium ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        disabled={!companyProfile.isPremium}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.hasChat ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isProcessing}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isProcessing}
                  className="flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Job Post...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Job Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Job Post Preview</DialogTitle>
            <DialogDescription>
              Review your job post before publishing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Job Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold mb-2">{formData.title}</h2>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {companyProfile.name}
                </span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {formData.location} ({formData.locationType})
                </span>
                <span className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {jobTypes.find(t => t.value === formData.jobType)?.label}
                </span>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{formData.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-muted-foreground">{formData.requirements}</p>
                </div>
              )}

              {formData.benefits && (
                <div>
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <p className="text-muted-foreground">{formData.benefits}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Experience Level:</span>
                  <p className="text-muted-foreground">
                    {experienceLevels.find(l => l.value === formData.experienceLevel)?.label}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Application Deadline:</span>
                  <p className="text-muted-foreground">
                    {new Date(formData.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {formData.hasChat && (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <div className="flex items-center text-secondary">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Chat area will be created for applicants</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Back to Edit
            </Button>
            <Button onClick={() => {
              setShowPreviewModal(false)
              handleSubmit({ preventDefault: () => {} })
            }}>
              <Send className="w-4 h-4 mr-2" />
              Create Job Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">
              Job Post Created Successfully! 🎉
            </DialogTitle>
            <DialogDescription>
              Your job post is now live and visible to jobseekers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Job Post Details:</span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-green-600">
                <p>• Title: {formData.title}</p>
                <p>• Type: {jobTypes.find(t => t.value === formData.jobType)?.label}</p>
                <p>• Location: {formData.location}</p>
                <p>• Deadline: {new Date(formData.deadline).toLocaleDateString()}</p>
                {formData.hasChat && (
                  <p>• Chat area: Created for applicants</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Next Steps:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Job post is now visible to jobseekers
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  You'll receive notifications for new applications
                </li>
                {formData.hasChat && (
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Chat area is ready for applicant communication
                  </li>
                )}
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Track applications in your dashboard
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share on LinkedIn
            </Button>
            <Button 
              onClick={() => {
                setShowSuccessModal(false)
                navigate("/dashboard/company")
              }}
              className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Active Posts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-yellow-600">
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              Upgrade to Premium to create chat areas for your job posts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-700">Premium Benefits:</h4>
              <ul className="space-y-2 text-sm text-yellow-600">
                <li>✓ Create chat areas for job posts</li>
                <li>✓ Real-time communication with applicants</li>
                <li>✓ Group and 1:1 messaging</li>
                <li>✓ Enhanced applicant engagement</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Maybe Later
            </Button>
            <Button 
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
              onClick={() => {
                setShowUpgradeModal(false)
                // Navigate to upgrade page or show upgrade form
                alert("Upgrade to Premium to unlock chat features!")
              }}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}