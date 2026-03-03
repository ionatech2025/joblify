import React, { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { 
  Building2, 
  MapPin, 
  Users, 
  Globe, 
  Linkedin,
  Briefcase,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Star,
  Calendar,
  Mail,
  Phone
} from "lucide-react"

export default function CompanySubscriptionPage() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  
  // State management
  const [company, setCompany] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [subscriptionType, setSubscriptionType] = useState("")
  const [userProfile, setUserProfile] = useState(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Form state for profile creation/update
  const [profileForm, setProfileForm] = useState({
    profileType: "",
    bio: "",
    skills: [],
    education: [],
    experience: [],
    certifications: []
  })

  // Available skills for selection
  const availableSkills = [
    "JavaScript", "React", "Node.js", "Python", "Java", "C++", "C#", "PHP",
    "HTML", "CSS", "TypeScript", "Angular", "Vue.js", "Django", "Flask",
    "MongoDB", "PostgreSQL", "MySQL", "AWS", "Azure", "Docker", "Kubernetes",
    "Git", "GitHub", "Agile", "Scrum", "Project Management", "Data Analysis",
    "Machine Learning", "AI", "UI/UX Design", "Graphic Design", "Marketing",
    "Sales", "Customer Service", "Content Writing", "SEO", "Social Media"
  ]

  // Mock company data
  const mockCompany = {
    id: companyId || "1",
    name: "TechCorp Solutions",
    industry: "Information Technology",
    size: "201-500",
    location: "San Francisco, CA",
    description: "Leading software development company specializing in cloud solutions and AI applications. We're passionate about innovation and creating technology that makes a difference. Our team values creativity, collaboration, and continuous learning. We offer competitive benefits, flexible work arrangements, and opportunities for professional growth.",
    yearEstablished: 2018,
    logo: null,
    website: "https://techcorp.com",
    linkedin: "https://linkedin.com/company/techcorp",
    rating: 4.5,
    activeJobs: 8,
    verified: true,
    suspended: false,
    contactEmail: "careers@techcorp.com",
    contactPhone: "415-555-0123"
  }

  // Mock user profile data
  const mockUserProfile = {
    id: "user123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    role: "JOB_SEEKER",
    profileType: null, // No profile type set yet
    profileComplete: false,
    bio: "",
    skills: [],
    education: [],
    experience: [],
    certifications: []
  }

  // Load company and user data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setCompany(mockCompany)
        setUserProfile(mockUserProfile)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [companyId])

  // Get company initials for avatar
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle subscription type selection
  const handleSubscriptionTypeSelect = (type) => {
    setSubscriptionType(type)
    
    // Check if user needs to create/update profile
    if (type === "EMPLOYABLE" && (!userProfile.profileType || userProfile.profileType !== "EMPLOYABLE")) {
      setShowProfileForm(true)
      setProfileForm(prev => ({ ...prev, profileType: "EMPLOYABLE" }))
    } else if (type === "VIRTUAL_INTERN" && (!userProfile.profileType || userProfile.profileType !== "VIRTUAL_INTERN")) {
      setShowProfileForm(true)
      setProfileForm(prev => ({ ...prev, profileType: "VIRTUAL_INTERN" }))
    } else {
      // User already has the required profile type, proceed to confirmation
      setCurrentStep(3)
    }
  }

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!profileForm.profileType || !profileForm.bio.trim()) {
      setErrors({ general: "Please fill in all required fields" })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call to create/update profile
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user profile
      setUserProfile(prev => ({
        ...prev,
        profileType: profileForm.profileType,
        profileComplete: true,
        bio: profileForm.bio,
        skills: profileForm.skills,
        education: profileForm.education,
        experience: profileForm.experience,
        certifications: profileForm.certifications
      }))
      
      setShowProfileForm(false)
      setCurrentStep(3)
      setErrors({})
      
    } catch (error) {
      console.error("Error saving profile:", error)
      setErrors({ general: "An error occurred while saving your profile. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle final subscription submission
  const handleSubscriptionSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call to create subscription
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success message
      setShowSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard/jobseeker")
      }, 3000)
      
    } catch (error) {
      console.error("Error creating subscription:", error)
      setErrors({ general: "An error occurred while creating your subscription. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle skill selection
  const toggleSkill = (skill) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading company information...</p>
          </div>
        </main>
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-4">Subscription Successful!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                You have successfully subscribed to {company.name} as a {subscriptionType === "EMPLOYABLE" ? "job seeker" : "virtual intern"}.
                The company will be notified of your interest and may contact you about opportunities.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/jobseeker")}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Go to Dashboard
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
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/companies")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Companies
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Subscribe to {company.name}
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose how you'd like to connect with this company
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Company Profile View */}
          {currentStep === 1 && (
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-8">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-primary">
                      {getCompanyInitials(company.name)}
                    </span>
                  )}
                </div>
                <CardTitle className="text-3xl mb-3">{company.name}</CardTitle>
                <CardDescription className="text-lg">
                  {company.industry} • {company.size} employees • Est. {company.yearEstablished}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Company Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="text-2xl font-bold text-primary">{company.rating}</div>
                    <div className="text-sm text-muted-foreground">Company Rating</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="text-2xl font-bold text-primary">{company.activeJobs}</div>
                    <div className="text-sm text-muted-foreground">Active Jobs</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="text-2xl font-bold text-primary">{company.location.split(',')[0]}</div>
                    <div className="text-sm text-muted-foreground">Location</div>
                  </div>
                </div>

                {/* Company Description */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">About {company.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {company.description}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm">{company.contactEmail}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm">{company.contactPhone}</span>
                  </div>
                </div>

                {/* External Links */}
                <div className="flex items-center justify-center space-x-4">
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Visit Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {company.linkedin && (
                    <a 
                      href={company.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Next Step Button */}
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold"
                >
                  Continue to Subscription Type
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Subscription Type Selection */}
          {currentStep === 2 && (
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Choose Your Subscription Type</CardTitle>
                <CardDescription>
                  Select how you'd like to connect with {company.name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <RadioGroup 
                  value={subscriptionType} 
                  onValueChange={handleSubscriptionTypeSelect}
                  className="space-y-4"
                >
                  {/* EMPLOYABLE Option */}
                  <div className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    subscriptionType === "EMPLOYABLE"
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}>
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="EMPLOYABLE" id="employable" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Briefcase className="w-6 h-6 text-primary" />
                          <Label htmlFor="employable" className="text-xl font-semibold cursor-pointer">
                            Apply as Job Seeker (EMPLOYABLE)
                          </Label>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          Apply for full-time, part-time, or contract positions. This option is for professionals 
                          seeking employment opportunities.
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>✓ Full-time positions</span>
                          <span>✓ Part-time roles</span>
                          <span>✓ Contract work</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VIRTUAL_INTERN Option */}
                  <div className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    subscriptionType === "VIRTUAL_INTERN"
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}>
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="VIRTUAL_INTERN" id="virtual_intern" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <GraduationCap className="w-6 h-6 text-primary" />
                          <Label htmlFor="virtual_intern" className="text-xl font-semibold cursor-pointer">
                            Subscribe as Virtual Intern (VI)
                          </Label>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          Express interest in virtual internship programs, learning opportunities, and skill development. 
                          This option is for students and learners.
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>✓ Internship programs</span>
                          <span>✓ Learning opportunities</span>
                          <span>✓ Skill development</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {/* Back Button */}
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="w-full h-12"
                >
                  Back to Company Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profile Creation/Update Form */}
          {showProfileForm && (
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {subscriptionType === "EMPLOYABLE" ? "Create Job Seeker Profile" : "Create Virtual Intern Profile"}
                </CardTitle>
                <CardDescription>
                  {subscriptionType === "EMPLOYABLE" 
                    ? "Complete your professional profile to apply for jobs at this company"
                    : "Set up your learning profile to express interest in internship opportunities"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Profile Type (Read-only) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Profile Type</Label>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">
                        {subscriptionType === "EMPLOYABLE" ? "Job Seeker (EMPLOYABLE)" : "Virtual Intern (VI)"}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold">
                      {subscriptionType === "EMPLOYABLE" ? "Professional Bio *" : "Learning Goals & Interests *"}
                    </Label>
                    <textarea
                      id="bio"
                      placeholder={
                        subscriptionType === "EMPLOYABLE" 
                          ? "Tell employers about your experience, skills, and career goals..."
                          : "Describe your learning objectives, interests, and what you hope to gain..."
                      }
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 resize-none"
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {subscriptionType === "EMPLOYABLE" ? "Professional Skills *" : "Skills & Interests"}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableSkills.slice(0, 20).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            profileForm.skills.includes(skill)
                              ? "bg-primary text-white shadow-lg scale-105"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted/70 hover:scale-105"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select skills that match your profile type and interests
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProfileForm(false)}
                      className="flex-1 h-12"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isSubmitting ? "Saving Profile..." : "Save Profile & Continue"}
                    </Button>
                  </div>

                  {errors.general && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600 text-center flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {errors.general}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Confirm Your Subscription</CardTitle>
                <CardDescription>
                  Review your subscription details before finalizing
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Subscription Summary */}
                <div className="p-6 bg-muted/20 rounded-xl">
                  <h3 className="font-semibold mb-4">Subscription Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{company.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profile Type:</span>
                      <span className="font-medium">
                        {subscriptionType === "EMPLOYABLE" ? "Job Seeker (EMPLOYABLE)" : "Virtual Intern (VI)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subscription Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div>
                  <h3 className="font-semibold mb-3">What Happens Next?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Your subscription will be visible to {company.name}</p>
                    <p>✓ The company may contact you about opportunities</p>
                    <p>✓ You'll receive updates about new positions</p>
                    <p>✓ Your subscription will appear in your dashboard</p>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 h-12"
                  >
                    Back to Selection
                  </Button>
                  <Button
                    onClick={handleSubscriptionSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isSubmitting ? "Creating Subscription..." : "Confirm Subscription"}
                  </Button>
                </div>

                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 text-center flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.general}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 