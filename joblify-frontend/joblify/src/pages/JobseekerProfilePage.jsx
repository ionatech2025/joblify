import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Sidebar } from "../components/Sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Phone, 
  MapPin, 
  Mail,
  Camera,
  Plus,
  X,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  Edit3
} from "lucide-react"

export default function JobseekerProfilePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeSections, setActiveSections] = useState({
    profile: true,
    personal: true,
    skills: true,
    education: true,
    experience: true,
    certifications: true,
    contact: true
  })
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [errors, setErrors] = useState({})

  // Form state
  const [formData, setFormData] = useState({
    // Profile Settings
    profileType: "",
    profileVisibility: "PRIVATE",
    
    // Personal Bio
    bio: "",
    
    // Skills
    skills: [],
    
    // Education
    education: [
      {
        id: 1,
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: ""
      }
    ],
    
    // Work Experience
    experience: [
      {
        id: 1,
        jobTitle: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: ""
      }
    ],
    
    // Certifications
    certifications: [
      {
        id: 1,
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        url: ""
      }
    ],
    
    // Contact Information
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
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

  // Profile type options
  const profileTypes = [
    { value: "EMPLOYABLE", label: "Employable", description: "Seeking full-time employment" },
    { value: "VIRTUAL_INTERN", label: "Virtual Intern (VI)", description: "Interested in virtual internship opportunities" }
  ]

  // Profile visibility options
  const visibilityOptions = [
    { value: "PUBLIC", label: "Public (Premium)", description: "Visible to all employers" },
    { value: "PRIVATE", label: "Private (Freemium)", description: "Visible only to selected employers" }
  ]

  // Toggle section visibility
  const toggleSection = (section) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setErrors(prev => ({ ...prev, profileImage: "Please upload a valid image file (JPG, PNG)" }))
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: "File size must be less than 5MB" }))
        return
      }
      
      setProfileImage(file)
      setProfileImagePreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, profileImage: "" }))
    }
  }

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    setErrors(prev => ({ ...prev, profileImage: "" }))
  }

  // Add new education entry
  const addEducation = () => {
    const newId = Math.max(...formData.education.map(edu => edu.id)) + 1
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: newId,
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: ""
      }]
    }))
  }

  // Remove education entry
  const removeEducation = (id) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter(edu => edu.id !== id)
      }))
    }
  }

  // Update education field
  const updateEducation = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  // Add new work experience entry
  const addExperience = () => {
    const newId = Math.max(...formData.experience.map(exp => exp.id)) + 1
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: newId,
        jobTitle: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: ""
      }]
    }))
  }

  // Remove work experience entry
  const removeExperience = (id) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter(exp => exp.id !== id)
      }))
    }
  }

  // Update experience field
  const updateExperience = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  // Add new certification entry
  const addCertification = () => {
    const newId = Math.max(...formData.certifications.map(cert => cert.id)) + 1
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        id: newId,
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        url: ""
      }]
    }))
  }

  // Remove certification entry
  const removeCertification = (id) => {
    if (formData.certifications.length > 1) {
      setFormData(prev => ({
        ...prev,
        certifications: prev.certifications.filter(cert => cert.id !== id)
      }))
    }
  }

  // Update certification field
  const updateCertification = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }))
  }

  // Toggle skill selection
  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    // Profile Type validation
    if (!formData.profileType) {
      newErrors.profileType = "Profile type is required"
    }

    // Bio validation
    if (!formData.bio.trim()) {
      newErrors.bio = "Personal bio is required"
    } else if (formData.bio.trim().length > 500) {
      newErrors.bio = "Bio must be 500 characters or less"
    }

    // Skills validation for EMPLOYABLE type
    if (formData.profileType === "EMPLOYABLE" && formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required for employable profiles"
    }

    // Education validation
    if (formData.education.length === 0) {
      newErrors.education = "At least one education entry is required"
    } else {
      formData.education.forEach((edu, index) => {
        if (!edu.institution.trim()) {
          newErrors[`education_${index}_institution`] = "Institution is required"
        }
        if (!edu.degree.trim()) {
          newErrors[`education_${index}_degree`] = "Degree is required"
        }
        if (!edu.startDate) {
          newErrors[`education_${index}_startDate`] = "Start date is required"
        }
      })
    }

    // Phone validation (if provided)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be exactly 10 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success message
      setShowSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard/jobseeker")
      }, 3000)
      
    } catch (error) {
      console.error("Error saving profile:", error)
      setErrors({ general: "An error occurred while saving your profile. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle phone number input
  const handlePhoneChange = (value) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 10)
    setFormData(prev => ({ ...prev, phone: numericValue }))
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }))
    }
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="JOBSEEKER" />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 flex items-center justify-center py-12">
            <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✅</span>
                </div>
                <h1 className="text-3xl font-bold text-green-600 mb-4">Profile Saved Successfully!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Your jobseeker profile has been created/updated and is now visible to employers.
                  You will be redirected to your dashboard shortly.
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
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="JOBSEEKER" />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
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
                Create/Update Profile
              </h1>
              <p className="text-xl text-muted-foreground">
                Build your professional profile to attract employers and virtual internship opportunities
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Settings Section */}
              {/* ...existing code... */}
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}