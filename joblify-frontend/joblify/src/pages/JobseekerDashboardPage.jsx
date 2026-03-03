import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  User, 
  Building2, 
  Briefcase, 
  Search, 
  Clock, 
  Bookmark, 
  FileText, 
  Settings,
  LogOut,
  Home,
  Bell,
  TrendingUp,
  Crown,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  Users2
} from "lucide-react"

export default function JobseekerDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Broadcast messaging state
  const [broadcastMessages, setBroadcastMessages] = useState([])
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)

  // Mock user data - in real app, this would come from authentication context
  useEffect(() => {
    // Simulate API call to get user data
    const fetchUserData = async () => {
      try {
        // Mock user data
        const mockUser = {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          role: "JOB_SEEKER",
          profileComplete: 75,
          lastLogin: "2024-01-15T10:30:00Z",
          profileUpdated: "2024-01-12T14:20:00Z",
          savedJobs: 8,
          appliedJobs: 12,
          avatar: null,
          subscriptions: [
            {
              id: "sub1",
              companyName: "TechCorp Solutions",
              type: "EMPLOYABLE",
              subscribedDate: "2024-01-10T14:30:00Z"
            },
            {
              id: "sub2",
              companyName: "HealthFirst Medical",
              type: "VIRTUAL_INTERN",
              subscribedDate: "2024-01-08T09:15:00Z"
            }
          ]
        }

        // Mock recent activity
        const mockActivity = [
          {
            id: 1,
            type: "profile_update",
            message: "Updated professional summary",
            timestamp: "2024-01-12T14:20:00Z",
            icon: "👤"
          },
          {
            id: 2,
            type: "job_application",
            message: "Applied to Senior Developer at TechCorp",
            timestamp: "2024-01-10T09:15:00Z",
            icon: "📝"
          },
          {
            id: 3,
            type: "job_save",
            message: "Saved Frontend Developer position",
            timestamp: "2024-01-08T16:45:00Z",
            icon: "🔖"
          }
        ]

        setUser(mockUser)
        setRecentActivity(mockActivity)
        
        // Mock broadcast messages
        const mockBroadcasts = [
          {
            id: "broadcast1",
            companyName: "TechCorp Solutions",
            jobTitle: "Frontend Developer",
            message: "Thank you for your application! We're currently reviewing all submissions and will schedule interviews next week. Please ensure your portfolio is up to date.",
            timestamp: "2024-01-15T14:30:00Z",
            hasReplied: false
          },
          {
            id: "broadcast2",
            companyName: "DataSystems Inc",
            jobTitle: "Backend Engineer",
            message: "We've received your application and are impressed with your background. We'd like to schedule a technical interview. Please let us know your availability.",
            timestamp: "2024-01-14T11:15:00Z",
            hasReplied: true
          }
        ]
        setBroadcastMessages(mockBroadcasts)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Check if user has JOB_SEEKER role
  useEffect(() => {
    if (user && user.role !== "JOB_SEEKER") {
      navigate("/login", { 
        state: { 
          message: "Access denied. Only job seekers can access this dashboard." 
        } 
      })
    }
  }, [user, navigate])

  const handleLogout = () => {
    // In real app, this would clear authentication tokens
    navigate("/login", { 
      state: { 
        message: "You have been logged out successfully." 
      } 
    })
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Initialize profile form data when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    }
  }, [user])

  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setProfileErrors(prev => ({ ...prev, profileImage: "Please upload a valid image file (JPG, PNG)" }))
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setProfileErrors(prev => ({ ...prev, profileImage: "File size must be less than 5MB" }))
        return
      }
      
      setProfileImage(file)
      setProfileImagePreview(URL.createObjectURL(file))
      setProfileErrors(prev => ({ ...prev, profileImage: "" }))
    }
  }

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    setProfileErrors(prev => ({ ...prev, profileImage: "" }))
  }

  // Handle profile form input changes
  const handleProfileInputChange = (field, value) => {
    setProfileFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (profileErrors[field]) {
      setProfileErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {}
    
    if (!profileFormData.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    
    if (!profileFormData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    
    if (!profileFormData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(profileFormData.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Password validation only if changing password
    if (showPasswordChange) {
      if (!profileFormData.currentPassword.trim()) {
        errors.currentPassword = "Current password is required"
      }
      
      if (!profileFormData.newPassword.trim()) {
        errors.newPassword = "New password is required"
      } else if (profileFormData.newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters long"
      }
      
      if (!profileFormData.confirmPassword.trim()) {
        errors.confirmPassword = "Confirm password is required"
      } else if (profileFormData.newPassword !== profileFormData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match"
      }
    }

    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return
    }

    setIsSavingProfile(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update user state with new data
      setUser(prev => ({
        ...prev,
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        email: profileFormData.email,
        profileUpdated: new Date().toISOString()
      }))
      
      // Reset form and close editing
      setIsEditingProfile(false)
      setShowPasswordChange(false)
      setProfileFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
      setProfileErrors({})
      
      // Show success message (you can add a toast notification here)
      console.log("Profile updated successfully!")
      
    } catch (error) {
      console.error("Error updating profile:", error)
      setProfileErrors(prev => ({
        ...prev,
        general: "Failed to update profile. Please try again."
      }))
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Cancel profile editing
  const handleCancelProfile = () => {
    setIsEditingProfile(false)
    setShowPasswordChange(false)
    setProfileFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    setProfileErrors({})
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  // Broadcast messaging functions
  const openBroadcastModal = (broadcast) => {
    setSelectedBroadcast(broadcast)
    setShowBroadcastModal(true)
    setReplyMessage("")
  }

  const closeBroadcastModal = () => {
    setShowBroadcastModal(false)
    setSelectedBroadcast(null)
    setReplyMessage("")
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return

    setIsSendingReply(true)
    
    try {
      // Simulate API call to send reply
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state to mark as replied
      setBroadcastMessages(prev => 
        prev.map(msg => 
          msg.id === selectedBroadcast.id 
            ? { ...msg, hasReplied: true }
            : msg
        )
      )
      
      // Close modal and reset
      setReplyMessage("")
      setShowBroadcastModal(false)
      setSelectedBroadcast(null)
      
      console.log("Reply sent successfully!")
      
    } catch (error) {
      console.error("Error sending reply:", error)
    } finally {
      setIsSendingReply(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="JOB_SEEKER" onLogout={handleLogout} onOpenProfile={() => setIsEditingProfile(true)} />
        <main className="flex-1 lg:ml-64 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user || user.role !== "JOB_SEEKER") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="JOB_SEEKER" onLogout={handleLogout} onOpenProfile={() => setIsEditingProfile(true)} />
        <main className="flex-1 lg:ml-64 transition-all duration-300 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this dashboard.
            </p>
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="JOB_SEEKER" onLogout={handleLogout} onOpenProfile={() => setIsEditingProfile(true)} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ready to take the next step in your career? Update your profile, explore companies, 
              and discover exciting job opportunities.
            </p>
            
            {/* Profile Completion Bar */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Profile Completion</span>
                <span className="text-sm font-semibold text-primary">{user.profileComplete}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${user.profileComplete}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-6 rounded-xl"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Primary Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Enhanced Profile Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">My Profile</CardTitle>
                <CardDescription>
                  Upload picture, edit info & change password
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>


            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">View Companies</CardTitle>
                <CardDescription>
                Explore registered companies
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Link to="/companies">
                    Browse Companies
                  </Link>
                </Button>
              </CardContent>
            </Card>








            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">View Companies</CardTitle>
                <CardDescription>
                Explore registered companies
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                   <Link to="/jobs">
                    Find Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* View Jobs Card */}
            {/* <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-accent/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl">View Jobs</CardTitle>
                <CardDescription>
                  Discover job opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full border-2 border-accent/50 hover:border-accent/70 hover:bg-accent/10"
                >
                  <Link to="/jobs">
                    Find Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card> */}

            {/* Application Tracking Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-yellow-500/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Application Tracking</CardTitle>
                <CardDescription>
                  Track your job applications
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                >
                  <Link to="/my-applications">
                    <FileText className="w-4 h-4 mr-2" />
                    My Applications
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Editing Modal */}
          {isEditingProfile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelProfile}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    {/* Profile Picture Upload */}
                    <div className="mb-6">
                      <Label className="text-sm font-semibold mb-3 block">Profile Picture</Label>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                            {profileImagePreview ? (
                              <img 
                                src={profileImagePreview} 
                                alt="Profile Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">👤</span>
                            )}
                          </div>
                          {profileImagePreview && (
                            <button
                              type="button"
                              onClick={removeProfileImage}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="profile-image-upload"
                          />
                          <Label 
                            htmlFor="profile-image-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {profileImagePreview ? 'Change Picture' : 'Upload Picture'}
                          </Label>
                          {profileErrors.profileImage && (
                            <p className="text-red-500 text-sm mt-1">{profileErrors.profileImage}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-semibold">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileFormData.firstName}
                          onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                          className="mt-1"
                          placeholder="Enter first name"
                        />
                        {profileErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileFormData.lastName}
                          onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                          className="mt-1"
                          placeholder="Enter last name"
                        />
                        {profileErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileFormData.email}
                        onChange={(e) => handleProfileInputChange('email', e.target.value)}
                        className="mt-1"
                        placeholder="Enter email address"
                      />
                      {profileErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{profileErrors.email}</p>
                      )}
                    </div>

                    {/* Password Change Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold">Password</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                          className="text-primary hover:text-primary/80"
                        >
                          {showPasswordChange ? 'Cancel' : 'Change Password'}
                        </Button>
                      </div>
                      
                      {showPasswordChange && (
                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Label htmlFor="currentPassword" className="text-sm font-semibold">Current Password</Label>
                            <div className="relative mt-1">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                value={profileFormData.currentPassword}
                                onChange={(e) => handleProfileInputChange('currentPassword', e.target.value)}
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {profileErrors.currentPassword && (
                              <p className="text-red-500 text-sm mt-1">{profileErrors.currentPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="newPassword" className="text-sm font-semibold">New Password</Label>
                            <div className="relative mt-1">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={profileFormData.newPassword}
                                onChange={(e) => handleProfileInputChange('newPassword', e.target.value)}
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {profileErrors.newPassword && (
                              <p className="text-red-500 text-sm mt-1">{profileErrors.newPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm New Password</Label>
                            <div className="relative mt-1">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={profileFormData.confirmPassword}
                                onChange={(e) => handleProfileInputChange('confirmPassword', e.target.value)}
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {profileErrors.confirmPassword && (
                              <p className="text-red-500 text-sm mt-1">{profileErrors.confirmPassword}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* General Error */}
                    {profileErrors.general && (
                      <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm text-center">{profileErrors.general}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        type="submit" 
                        disabled={isSavingProfile}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        {isSavingProfile ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancelProfile}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast Messages Section */}
          {broadcastMessages.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Company Messages</h2>
                <Badge variant="outline" className="px-3 py-1">
                  {broadcastMessages.length} message{broadcastMessages.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {broadcastMessages.map((broadcast) => (
                  <Card key={broadcast.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{broadcast.companyName}</h3>
                            <p className="text-sm text-muted-foreground">{broadcast.jobTitle}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={broadcast.hasReplied ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {broadcast.hasReplied ? "Replied" : "New"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {broadcast.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(broadcast.timestamp)}
                        </span>
                        <Button
                          onClick={() => openBroadcastModal(broadcast)}
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                        >
                          {broadcast.hasReplied ? "View & Reply" : "Reply"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{user.savedJobs}</div>
              <div className="text-sm text-muted-foreground">Saved Jobs</div>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{user.appliedJobs}</div>
              <div className="text-sm text-muted-foreground">Applied Jobs</div>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{user.profileComplete}%</div>
              <div className="text-sm text-muted-foreground">Profile Complete</div>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-muted-primary" />
              </div>
              <div className="text-lg font-bold text-primary">
                {formatTimeAgo(user.lastLogin)}
              </div>
              <div className="text-sm text-muted-foreground">Last Login</div>
            </Card>
          </div>

          {/* My Subscriptions */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Subscriptions</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/companies">Explore Companies</Link>
              </Button>
            </div>
            
            {user.subscriptions && user.subscriptions.length > 0 ? (
              <div className="space-y-4">
                {user.subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="p-4 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{subscription.companyName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {subscription.type === "EMPLOYABLE" ? "Job Seeker" : "Virtual Intern"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Subscribed {formatTimeAgo(subscription.subscribedDate)}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Company
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Subscriptions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring companies and subscribe to opportunities that interest you.
                </p>
                <Button asChild>
                  <Link to="/companies">Explore Companies</Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center text-lg">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Broadcast Reply Modal */}
      {showBroadcastModal && selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Company Message</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeBroadcastModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Company Message Display */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedBroadcast.companyName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedBroadcast.jobTitle}</p>
                  </div>
                </div>
                <p className="text-foreground">{selectedBroadcast.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTimeAgo(selectedBroadcast.timestamp)}
                </p>
              </div>

              {/* Reply Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}>
                <div className="mb-6">
                  <Label htmlFor="replyMessage" className="text-sm font-semibold mb-3 block">
                    Your Reply
                  </Label>
                  <textarea
                    id="replyMessage"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the company..."
                    className="w-full p-3 border border-border rounded-lg focus:border-primary focus:ring-primary/20 transition-colors min-h-[120px] resize-y"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isSendingReply ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={closeBroadcastModal}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 