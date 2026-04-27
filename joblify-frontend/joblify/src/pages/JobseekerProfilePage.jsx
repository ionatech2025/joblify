import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { localStorageUtils } from '../utils/localStorage';
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
  Edit3,
} from 'lucide-react';

export default function JobseekerProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: '',
  });
  const [activeSections, setActiveSections] = useState({
    profile: true,
    personal: true,
    skills: true,
    education: true,
    experience: true,
    certifications: true,
    contact: true,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    // Profile Settings
    profileType: '',
    profileVisibility: 'PRIVATE',

    // Personal Bio
    bio: '',

    // Skills
    skills: [],

    // Education
    education: [
      {
        id: 1,
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        description: '',
      },
    ],

    // Work Experience
    experience: [
      {
        id: 1,
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: '',
      },
    ],

    // Certifications
    certifications: [
      {
        id: 1,
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        url: '',
      },
    ],

    // Contact Information
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  // Available skills for selection
  const availableSkills = [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'C++',
    'C#',
    'PHP',
    'HTML',
    'CSS',
    'TypeScript',
    'Angular',
    'Vue.js',
    'Django',
    'Flask',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'AWS',
    'Azure',
    'Docker',
    'Kubernetes',
    'Git',
    'GitHub',
    'Agile',
    'Scrum',
    'Project Management',
    'Data Analysis',
    'Machine Learning',
    'AI',
    'UI/UX Design',
    'Graphic Design',
    'Marketing',
    'Sales',
    'Customer Service',
    'Content Writing',
    'SEO',
    'Social Media',
  ];

  // Profile type options
  const profileTypes = [
    { value: 'EMPLOYABLE', label: 'Employable', description: 'Seeking full-time employment' },
    {
      value: 'VIRTUAL_INTERN',
      label: 'Virtual Intern (VI)',
      description: 'Interested in virtual internship opportunities',
    },
  ];

  // Profile visibility options
  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public (Premium)', description: 'Visible to all employers' },
    {
      value: 'PRIVATE',
      label: 'Private (Freemium)',
      description: 'Visible only to selected employers',
    },
  ];

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorageUtils.getUserData();
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || '',
        bio: userData.bio || '',
        profileType: userData.profileType || 'EMPLOYABLE',
        profileVisibility: userData.profileVisibility || 'PRIVATE',
        skills: userData.skills || [],
      }));

      if (userData.avatar) {
        setProfileImagePreview(userData.avatar);
      }
    }
  }, []);

  // Toggle section visibility
  const toggleSection = (section) => {
    setActiveSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setErrors((prev) => ({
          ...prev,
          profileImage: 'Please upload a valid image file (JPG, PNG)',
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
        return;
      }

      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, profileImage: '' }));
    }
  };

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setErrors((prev) => ({ ...prev, profileImage: '' }));
  };

  // Add new education entry
  const addEducation = () => {
    const newId = Math.max(...formData.education.map((edu) => edu.id)) + 1;
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: newId,
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          gpa: '',
          description: '',
        },
      ],
    }));
  };

  // Remove education entry
  const removeEducation = (id) => {
    if (formData.education.length > 1) {
      setFormData((prev) => ({
        ...prev,
        education: prev.education.filter((edu) => edu.id !== id),
      }));
    }
  };

  // Update education field
  const updateEducation = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    }));
  };

  // Add new work experience entry
  const addExperience = () => {
    const newId = Math.max(...formData.experience.map((exp) => exp.id)) + 1;
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: newId,
          jobTitle: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          responsibilities: '',
        },
      ],
    }));
  };

  // Remove work experience entry
  const removeExperience = (id) => {
    if (formData.experience.length > 1) {
      setFormData((prev) => ({
        ...prev,
        experience: prev.experience.filter((exp) => exp.id !== id),
      }));
    }
  };

  // Update experience field
  const updateExperience = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }));
  };

  // Add new certification entry
  const addCertification = () => {
    const newId = Math.max(...formData.certifications.map((cert) => cert.id)) + 1;
    setFormData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: newId,
          name: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          credentialId: '',
          url: '',
        },
      ],
    }));
  };

  // Remove certification entry
  const removeCertification = (id) => {
    if (formData.certifications.length > 1) {
      setFormData((prev) => ({
        ...prev,
        certifications: prev.certifications.filter((cert) => cert.id !== id),
      }));
    }
  };

  // Update certification field
  const updateCertification = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  // Toggle skill selection
  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    console.log('Validating form data:', formData);

    // Profile Type validation
    if (!formData.profileType) {
      console.log('Profile type validation failed');
      newErrors.profileType = 'Profile type is required';
    }

    // Bio validation
    if (!formData.bio.trim()) {
      console.log('Bio validation failed');
      newErrors.bio = 'Personal bio is required';
    } else if (formData.bio.trim().length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    // Skills validation for EMPLOYABLE type
    if (formData.profileType === 'EMPLOYABLE' && formData.skills.length === 0) {
      console.log('Skills validation failed for employable profile');
      newErrors.skills = 'At least one skill is required for employable profiles';
    }

    // Education validation - make this optional for now
    // if (formData.education.length === 0) {
    //   newErrors.education = 'At least one education entry is required';
    // } else {
    //   formData.education.forEach((edu, index) => {
    //     if (!edu.institution.trim()) {
    //       newErrors[`education_${index}_institution`] = 'Institution is required';
    //     }
    //     if (!edu.degree.trim()) {
    //       newErrors[`education_${index}_degree`] = 'Degree is required';
    //     }
    //     if (!edu.startDate) {
    //       newErrors[`education_${index}_startDate`] = 'Start date is required';
    //     }
    //   })
    // }

    // Phone validation (if provided)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    console.log('Form submission triggered');
    e.preventDefault();

    const isValid = validateForm();
    console.log('Form validation result:', isValid);

    if (!isValid) {
      console.log('Validation failed, showing error notification');
      showNotification('error', 'Please fill in all required fields correctly.');
      return;
    }

    console.log('Validation passed, starting save process');
    setIsSaving(true);

    try {
      // Handle profile image - convert to data URL if needed
      let avatarUrl = null;
      if (profileImage) {
        console.log('Processing profile image');
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = resolve;
          reader.readAsDataURL(profileImage);
        });
        avatarUrl = reader.result;
      } else if (profileImagePreview) {
        avatarUrl = profileImagePreview;
      }

      // Get current user data
      const currentUserData = localStorageUtils.getUserData();
      console.log('Current user data:', currentUserData);

      // Update user data with profile information
      const updatedUserData = {
        ...currentUserData,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        bio: formData.bio,
        profileType: formData.profileType,
        profileVisibility: formData.profileVisibility,
        skills: formData.skills,
        education: formData.education,
        experience: formData.experience,
        certifications: formData.certifications,
        avatar: avatarUrl,
        profileUpdated: new Date().toISOString(),
        profileComplete: 100, // Mark profile as complete
      };

      console.log('Updated user data:', updatedUserData);

      // Save to localStorage
      localStorageUtils.setUserData(updatedUserData);
      localStorageUtils.storeSignupData(formData.email, updatedUserData);
      console.log('Data saved to localStorage');

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success notification
      showNotification('success', 'Profile saved successfully! Redirecting to dashboard...');
      console.log('Success notification shown');

      // Show success message and redirect after 3 seconds
      setTimeout(() => {
        console.log('Redirecting to dashboard');
        navigate('/dashboard/jobseeker');
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('error', 'Failed to save profile. Please try again.');
      setErrors({ general: 'An error occurred while saving your profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Show notification function
  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message,
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  // Handle phone number input
  const handlePhoneChange = (value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: numericValue }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

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
                <h1 className="text-3xl font-bold text-green-600 mb-4">
                  Profile Saved Successfully!
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Your jobseeker profile has been created/updated and is now visible to employers.
                  You will be redirected to your dashboard shortly.
                </p>
                <Button
                  onClick={() => navigate('/dashboard/jobseeker')}
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
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification((prev) => ({ ...prev, show: false }))}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                  onClick={() => navigate('/dashboard/jobseeker')}
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
                Build your professional profile to attract employers and virtual internship
                opportunities
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Settings Section */}
              <Card className="border-2 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Profile Settings</CardTitle>
                      <CardDescription>Choose your profile type and visibility</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('profile')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {activeSections.profile ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {activeSections.profile && (
                  <CardContent className="space-y-6">
                    {/* Profile Type */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Profile Type *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.profileType === type.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, profileType: type.value }))
                            }
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  formData.profileType === type.value
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                }`}
                              >
                                {formData.profileType === type.value && (
                                  <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.profileType && (
                        <p className="text-red-500 text-sm mt-1">{errors.profileType}</p>
                      )}
                    </div>

                    {/* Profile Visibility */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Profile Visibility</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibilityOptions.map((option) => (
                          <div
                            key={option.value}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.profileVisibility === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, profileVisibility: option.value }))
                            }
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  formData.profileVisibility === option.value
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                }`}
                              >
                                {formData.profileVisibility === option.value && (
                                  <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Personal Information Section */}
              <Card className="border-2 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Personal Information</CardTitle>
                      <CardDescription>Add your personal details and bio</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('personal')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {activeSections.personal ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {activeSections.personal && (
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div>
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
                            ) : (
                              <span className="text-2xl">👤</span>
                            )}
                          </div>
                          {profileImagePreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileImage(null);
                                setProfileImagePreview(null);
                              }}
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
                          {errors.profileImage && (
                            <p className="text-red-500 text-sm mt-1">{errors.profileImage}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <Label htmlFor="bio" className="text-sm font-semibold">
                        Personal Bio *
                      </Label>
                      <textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                        className="mt-1 w-full p-3 border border-border rounded-lg focus:border-primary/50 focus:ring-primary/20 transition-all"
                        rows={4}
                        placeholder="Tell us about yourself, your career goals, and what makes you unique..."
                        maxLength={500}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formData.bio.length}/500 characters
                        </span>
                        {errors.bio && <span className="text-xs text-red-500">{errors.bio}</span>}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Skills Section */}
              <Card className="border-2 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Skills</CardTitle>
                      <CardDescription>Add your technical and professional skills</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('skills')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {activeSections.skills ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {activeSections.skills && (
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Select Your Skills</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableSkills.map((skill) => (
                          <div
                            key={skill}
                            className={`p-2 border rounded-lg cursor-pointer transition-all text-sm ${
                              formData.skills.includes(skill)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                skills: prev.skills.includes(skill)
                                  ? prev.skills.filter((s) => s !== skill)
                                  : [...prev.skills, skill],
                              }));
                            }}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                      {errors.skills && (
                        <p className="text-red-500 text-sm mt-2">{errors.skills}</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Contact Information Section */}
              <Card className="border-2 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Contact Information</CardTitle>
                      <CardDescription>Add your contact details</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('contact')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {activeSections.contact ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {activeSections.contact && (
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-sm font-semibold">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="mt-1"
                          placeholder="1234567890"
                          maxLength={10}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          className="mt-1"
                          placeholder="your.email@example.com"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed here
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-sm font-semibold">
                        Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="mt-1"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-semibold">
                          City
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className="mt-1"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-semibold">
                          State
                        </Label>
                        <Input
                          id="state"
                          type="text"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, state: e.target.value }))
                          }
                          className="mt-1"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-sm font-semibold">
                          Zip Code
                        </Label>
                        <Input
                          id="zipCode"
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, zipCode: e.target.value }))
                          }
                          className="mt-1"
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>

              {/* General Error Display */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-600">{errors.general}</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
