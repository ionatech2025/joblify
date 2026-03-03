import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Linkedin, 
  Camera,
  Save,
  ArrowLeft,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle
} from "lucide-react"

export default function CompanyProfilePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeSections, setActiveSections] = useState({
    basic: true,
    description: true,
    contact: true,
    online: true,
    representative: true
  })
  const [companyLogo, setCompanyLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [errors, setErrors] = useState({})

  // Form state
  const [formData, setFormData] = useState({
    // Basic Company Information
    companyName: "",
    industry: "",
    companySize: "",
    yearEstablished: "",
    
    // Description & Branding
    description: "",
    
    // Contact & Location
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    
    // Online Presence
    website: "",
    linkedin: "",
    
    // Representative Contact
    representativeName: "",
    representativePhone: "",
    representativeEmail: ""
  })

  // Available industries/sectors
  const industries = [
    "Information Technology",
    "Healthcare",
    "Finance & Banking",
    "Manufacturing",
    "Retail & E-commerce",
    "Education",
    "Hospitality & Tourism",
    "Real Estate",
    "Transportation & Logistics",
    "Energy & Utilities",
    "Media & Entertainment",
    "Consulting & Professional Services",
    "Non-profit & Government",
    "Agriculture & Food",
    "Construction & Engineering",
    "Automotive",
    "Telecommunications",
    "Biotechnology & Pharmaceuticals",
    "Aerospace & Defense",
    "Other"
  ]

  // Company size options
  const companySizes = [
    { value: "1-10", label: "1-10 employees", description: "Startup/Small business" },
    { value: "11-50", label: "11-50 employees", description: "Growing company" },
    { value: "51-200", label: "51-200 employees", description: "Medium business" },
    { value: "201-500", label: "201-500 employees", description: "Large company" },
    { value: "501-1000", label: "501-1000 employees", description: "Enterprise" },
    { value: "1000+", label: "1000+ employees", description: "Major corporation" }
  ]

  // Toggle section visibility
  const toggleSection = (section) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Handle company logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setErrors(prev => ({ ...prev, companyLogo: "Please upload a valid image file (JPG, PNG)" }))
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, companyLogo: "File size must be less than 5MB" }))
        return
      }
      
      setCompanyLogo(file)
      setLogoPreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, companyLogo: "" }))
    }
  }

  // Remove company logo
  const removeLogo = () => {
    setCompanyLogo(null)
    setLogoPreview(null)
    setErrors(prev => ({ ...prev, companyLogo: "" }))
  }

  // Handle phone number input
  const handlePhoneChange = (value, field) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 10)
    setFormData(prev => ({ ...prev, [field]: numericValue }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  // Validate URL format
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    // Basic Company Information validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required"
    }

    if (!formData.industry) {
      newErrors.industry = "Industry is required"
    }

    if (!formData.yearEstablished) {
      newErrors.yearEstablished = "Year established is required"
    } else if (formData.yearEstablished < 1800 || formData.yearEstablished > new Date().getFullYear()) {
      newErrors.yearEstablished = "Please enter a valid year"
    }

    // Contact validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits"
    }

    // Representative validation
    if (!formData.representativeName.trim()) {
      newErrors.representativeName = "Representative name is required"
    }

    if (!formData.representativeEmail.trim()) {
      newErrors.representativeEmail = "Representative email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.representativeEmail)) {
      newErrors.representativeEmail = "Please enter a valid email address"
    }

    // URL validation (if provided)
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid website URL"
    }

    if (formData.linkedin && !isValidUrl(formData.linkedin)) {
      newErrors.linkedin = "Please enter a valid LinkedIn URL"
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
        navigate("/dashboard/company")
      }, 3000)
      
    } catch (error) {
      console.error("Error saving company profile:", error)
      setErrors({ general: "An error occurred while saving your company profile. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

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
              <h1 className="text-3xl font-bold text-green-600 mb-4">Company Profile Saved!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your company profile has been successfully created/updated and is now visible to jobseekers.
                You can now post jobs and manage your hiring process.
              </p>
              <Button 
                onClick={() => navigate("/dashboard/company")}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Go to Company Dashboard
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
                onClick={() => navigate("/dashboard/company")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Company Profile
            </h1>
            <p className="text-xl text-muted-foreground">
              Create or update your company profile to attract top talent and build credibility
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Company Information Section */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Basic Company Information</CardTitle>
                      <CardDescription>Essential details about your organization</CardDescription>
                    </div>
                  </div>
                  {activeSections.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {activeSections.basic && (
                <CardContent className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold">
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className={errors.companyName ? 'border-red-300' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-semibold">
                      Industry/Sector *
                    </Label>
                    <select
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      className={`w-full p-3 border-2 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${
                        errors.industry ? 'border-red-300' : 'border-border/50'
                      }`}
                    >
                      <option value="">Select an industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.industry}
                      </p>
                    )}
                  </div>

                  {/* Company Size */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Company Size</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companySizes.map((size) => (
                        <div
                          key={size.value}
                          className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                            formData.companySize === size.value
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, companySize: size.value }))}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              formData.companySize === size.value
                                ? "border-primary bg-primary"
                                : "border-border/50"
                            }`}>
                              {formData.companySize === size.value && (
                                <div className="w-2 h-2 bg-white rounded-full m-auto" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold">{size.label}</div>
                              <div className="text-sm text-muted-foreground">{size.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Year Established */}
                  <div className="space-y-2">
                    <Label htmlFor="yearEstablished" className="text-sm font-semibold">
                      Year Established *
                    </Label>
                    <Input
                      id="yearEstablished"
                      type="number"
                      placeholder="e.g., 2020"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={formData.yearEstablished}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearEstablished: e.target.value }))}
                      className={errors.yearEstablished ? 'border-red-300' : ''}
                    />
                    {errors.yearEstablished && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.yearEstablished}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Description & Branding Section */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('description')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Description & Branding</CardTitle>
                      <CardDescription>Tell jobseekers about your company</CardDescription>
                    </div>
                  </div>
                  {activeSections.description ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {activeSections.description && (
                <CardContent className="space-y-6">
                  {/* Company Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Company Description
                    </Label>
                    <textarea
                      id="description"
                      placeholder="Describe your company's mission, values, culture, and what makes you unique..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={5}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Help jobseekers understand your company culture and values.
                    </p>
                  </div>

                  {/* Company Logo */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Company Logo (Optional)</Label>
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-border/50">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="file"
                          id="companyLogo"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Label 
                          htmlFor="companyLogo" 
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Label>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeLogo}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: PNG, JPG, JPEG. Max size: 5MB. Recommended: 400x400px or larger.
                    </p>
                    {errors.companyLogo && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.companyLogo}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Contact & Location Section */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('contact')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Contact & Location</CardTitle>
                      <CardDescription>Where jobseekers can find and contact you</CardDescription>
                    </div>
                  </div>
                  {activeSections.contact ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {activeSections.contact && (
                <CardContent className="space-y-6">
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="1234567890"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, 'phone')}
                      maxLength={10}
                      className={errors.phone ? 'border-red-300' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Official Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={errors.email ? 'border-red-300' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">Physical Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Business Street"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g., San Francisco"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State/Province</Label>
                      <Input
                        id="state"
                        placeholder="e.g., California"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-medium">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="e.g., 94105"
                        value={formData.zipCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Input
                      id="country"
                      placeholder="e.g., United States"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Online Presence Section */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('online')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Online Presence</CardTitle>
                      <CardDescription>Your digital footprint and social media</CardDescription>
                    </div>
                  </div>
                  {activeSections.online ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {activeSections.online && (
                <CardContent className="space-y-6">
                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-semibold">Company Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.company.com"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className={errors.website ? 'border-red-300' : ''}
                    />
                    {errors.website && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.website}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Include https:// for external links
                    </p>
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm font-semibold">LinkedIn Company Page</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/company/company-name"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className={errors.linkedin ? 'border-red-300' : ''}
                    />
                    {errors.linkedin && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.linkedin}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Your company's LinkedIn profile URL
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Representative Contact Section */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('representative')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Representative Contact</CardTitle>
                      <CardDescription>Primary contact person for jobseekers</CardDescription>
                    </div>
                  </div>
                  {activeSections.representative ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {activeSections.representative && (
                <CardContent className="space-y-6">
                  {/* Representative Name */}
                  <div className="space-y-2">
                    <Label htmlFor="representativeName" className="text-sm font-semibold">
                      Representative Name *
                    </Label>
                    <Input
                      id="representativeName"
                      placeholder="Full name of the primary contact person"
                      value={formData.representativeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, representativeName: e.target.value }))}
                      className={errors.representativeName ? 'border-red-300' : ''}
                    />
                    {errors.representativeName && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.representativeName}
                      </p>
                    )}
                  </div>

                  {/* Representative Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="representativePhone" className="text-sm font-semibold">Representative Phone</Label>
                    <Input
                      id="representativePhone"
                      placeholder="1234567890"
                      value={formData.representativePhone}
                      onChange={(e) => handlePhoneChange(e.target.value, 'representativePhone')}
                      maxLength={10}
                    />
                  </div>

                  {/* Representative Email */}
                  <div className="space-y-2">
                    <Label htmlFor="representativeEmail" className="text-sm font-semibold">
                      Representative Email *
                    </Label>
                    <Input
                      id="representativeEmail"
                      type="email"
                      placeholder="representative@company.com"
                      value={formData.representativeEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, representativeEmail: e.target.value }))}
                      className={errors.representativeEmail ? 'border-red-300' : ''}
                    />
                    {errors.representativeEmail && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.representativeEmail}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/company")}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Company Profile
                  </>
                )}
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
        </div>
      </main>
    </div>
  )
} 