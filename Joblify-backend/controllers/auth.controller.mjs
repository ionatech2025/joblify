import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma.mjs";
import bcrypt from "bcryptjs";

// ==========================================
// UNIFIED SIGNUP ENDPOINT (for your frontend)
// ==========================================

export const signup = asyncHandler(async (req, res) => {
  console.log("🔍 UNIFIED SIGNUP BODY:", JSON.stringify(req.body, null, 2));
  
  const {
    userType,
    // Jobseeker fields
    firstName,
    lastName,
    // Company fields  
    companyName,
    industry,
    description,
    size,
    establishmentYear,
    address,
    fullName,
    position,
    website,
    linkedin,
    // Common fields
    email,
    password,
    confirmPassword,
    phone,
    terms
  } = req.body;

  // Validate required fields
  if (!userType || !email || !password || !confirmPassword || !terms) {
    return res.status(400).json({
      success: false,
      message: "User type, email, password, and terms agreement are required"
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match"
    });
  }

  if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters with letters and numbers"
    });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    if (userType === "jobseeker" || userType === "JOB_SEEKER") {
      // Jobseeker registration
      if (!firstName || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          message: "First name, last name, and phone are required for job seekers"
        });
      }

      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid phone number with at least 10 digits"
        });
      }

      const newUser = await prisma.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: cleanPhone,
          password: hashedPassword,
          userType: "JOB_SEEKER",
          points: 0,
          subscriptionStatus: "INACTIVE",
          surveysubscriptionStatus: "INACTIVE",
          verificationStatus: "PENDING"
        }
      });

      // Create job seeker profile
      await prisma.jobSeekerProfile.create({
        data: {
          userId: newUser.id,
          profileType: "EMPLOYABLE"
        }
      });

      res.status(201).json({
        success: true,
        message: "Job seeker account created successfully",
        redirectTo: "/login",
        userId: newUser.id
      });

    } else if (userType === "company" || userType === "COMPANY") {
      // Company registration - validate required fields
      const requiredCompanyFields = [
        'companyName', 'industry', 'description', 'size', 
        'establishmentYear', 'address', 'fullName', 'position', 'phone'
      ];

      for (const field of requiredCompanyFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required for company registration`
          });
        }
      }

      const cleanPhone = phone.replace(/\D/g, "");
      
      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid company phone number with at least 10 digits"
        });
      }

      // Create company user - using correct schema field names
      const newCompany = await prisma.user.create({
        data: {
          companyName: companyName.trim(),
          email: email.toLowerCase().trim(),
          phone: cleanPhone,
          password: hashedPassword,
          userType: "COMPANY",
          industry: industry,
          companySize: size, // Maps to companySize in schema
          establishmentYear: parseInt(establishmentYear),
          description: description.trim(),
          address: address.trim(),
          website: website || null,
          linkedin: linkedin || null,
          contactPersonName: fullName.trim(), // Maps fullName to contactPersonName
          contactPersonPosition: position.trim(), // Maps position to contactPersonPosition
          points: 0,
          subscriptionStatus: "INACTIVE",
          surveysubscriptionStatus: "INACTIVE",
          verificationStatus: "PENDING"
        }
      });

      // Create company profile - using correct schema field names
      await prisma.companyProfile.create({
        data: {
          userId: newCompany.id,
          companyName: companyName.trim(),
          industry: industry,
          companySize: size,
          establishmentYear: parseInt(establishmentYear),
          description: description.trim(),
          phone: cleanPhone,
          email: email.toLowerCase().trim(),
          address: address.trim(),
          website: website || null,
          linkedin: linkedin || null,
          contactPersonName: fullName.trim(),
          contactPersonPosition: position.trim()
        }
      });

      res.status(201).json({
        success: true,
        message: "Company account created successfully",
        redirectTo: "/login",
        companyId: newCompany.id
      });

    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'jobseeker' or 'company'"
      });
    }

  } catch (error) {
    console.error("Unified signup error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists"
      });
    }
    
    // Log the full error for debugging
    console.error("Full error details:", {
      code: error.code,
      meta: error.meta,
      message: error.message
    });
    
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// EXISTING REGISTRATION ENDPOINTS (keep for compatibility)
// ==========================================

export const registerJobseeker = asyncHandler(async (req, res) => {
  console.log("🔍 JOBSEEKER REGISTRATION BODY:", JSON.stringify(req.body, null, 2));
  
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    confirmPassword,
    agreeToTerms
  } = req.body;

  // ✅ Validation - Check all required fields
  if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
    console.log("❌ Missing fields detected:", {
      firstName: !!firstName, lastName: !!lastName, email: !!email,
      phoneNumber: !!phoneNumber, password: !!password, confirmPassword: !!confirmPassword
    });
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  if (!agreeToTerms) {
    return res.status(400).json({
      success: false,
      message: "You must agree to the terms and conditions"
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match"
    });
  }

  // Phone validation
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid phone number with at least 10 digits"
    });
  }

  // Password strength
  if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters with letters and numbers"
    });
  }

  try {
    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findFirst({
      where: { phone: cleanPhone }
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: cleanPhone,
        password: hashedPassword,
        userType: "JOB_SEEKER",
        points: 0,
        subscriptionStatus: "INACTIVE",
        surveysubscriptionStatus: "INACTIVE",
        verificationStatus: "PENDING"
      }
    });

    // Create job seeker profile
    await prisma.jobSeekerProfile.create({
      data: {
        userId: newUser.id,
        profileType: "EMPLOYABLE"
      }
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please login.",
      redirectTo: "/login",
      userId: newUser.id
    });

  } catch (error) {
    console.error("Jobseeker registration error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A user with this email or phone already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export const registerCompany = asyncHandler(async (req, res) => {
  console.log("🔍 COMPANY REGISTRATION BODY:", JSON.stringify(req.body, null, 2));
  
  const {
    companyName,
    email,
    password,
    confirmPassword,
    industry,
    phone,
    address,
    companySize,
    establishmentYear,
    description,
    contactPersonName,
    contactPersonPosition,
    website,
    linkedin,
    agreeToTerms
  } = req.body;

  // ✅ Validation
  const requiredFields = [
    'companyName', 'email', 'password', 'confirmPassword', 'industry',
    'phone', 'address', 'companySize', 'establishmentYear', 'description',
    'contactPersonName', 'contactPersonPosition', 'agreeToTerms'
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      console.log(`❌ Missing field: ${field}`);
      return res.status(400).json({
        success: false,
        message: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
      });
    }
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match"
    });
  }

  if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters with letters and numbers"
    });
  }

  // Phone validation
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid phone number with at least 10 digits"
    });
  }

  try {
    // Check existing company
    const existingCompany = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company
    const newCompany = await prisma.user.create({
      data: {
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        phone: cleanPhone,
        password: hashedPassword,
        userType: "COMPANY",
        industry,
        companySize,
        establishmentYear: parseInt(establishmentYear),
        description: description.trim(),
        address: address.trim(),
        website,
        linkedin,
        contactPersonName: contactPersonName.trim(),
        contactPersonPosition: contactPersonPosition.trim(),
        points: 0,
        subscriptionStatus: "INACTIVE",
        surveysubscriptionStatus: "INACTIVE",
        verificationStatus: "PENDING"
      }
    });

    // Create company profile
    await prisma.companyProfile.create({
      data: {
        userId: newCompany.id,
        companyName: companyName.trim(),
        industry,
        companySize,
        establishmentYear: parseInt(establishmentYear),
        description: description.trim(),
        phone: cleanPhone,
        email: email.toLowerCase().trim(),
        address: address.trim(),
        website,
        linkedin,
        contactPersonName: contactPersonName.trim(),
        contactPersonPosition: contactPersonPosition.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: "Company account created successfully. Please login.",
      redirectTo: "/login",
      companyId: newCompany.id
    });

  } catch (error) {
    console.error("Company registration error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A company with this email already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Company registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// LOGIN & SESSIONS
// ==========================================

export const createLoginSession = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        userType: true,
        phone: true,
        points: true,
        companyName: true,
        subscriptionStatus: true,
        verificationStatus: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Create login session
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown'
      }
    });

    // Set user session
    req.session.userId = user.id;
    req.session.userType = user.userType;
    req.session.email = user.email;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Determine redirect path
    let redirectTo = "/dashboard";
    if (user.userType === "JOB_SEEKER") {
      redirectTo = "/jobseeker/dashboard";
    } else if (user.userType === "COMPANY") {
      redirectTo = "/company/dashboard";
    }

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      redirectTo
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// PRIVACY & SECURITY
// ==========================================

export const getPrivacySettings = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        privacySettings: true,
        userType: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      privacySettings: user
    });

  } catch (error) {
    console.error("Privacy settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch privacy settings",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export const updatePrivacySettings = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  const { firstName, lastName, phone, privacySettings } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(privacySettings && { privacySettings })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        privacySettings: true
      }
    });

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      privacySettings: updatedUser
    });

  } catch (error) {
    console.error("Update privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update privacy settings",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// LOGIN ACTIVITY & SESSIONS
// ==========================================

export const getLoginActivity = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  try {
    const activities = await prisma.loginSession.findMany({
      where: { userId },
      orderBy: { loginTime: 'desc' },
      take: 10
    });

    // Mark current session (simplified logic)
    const activitiesWithCurrent = activities.map(activity => ({
      id: activity.id,
      loginTime: activity.loginTime,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      isActive: activity.isActive,
      current: activity.isActive
    }));

    res.status(200).json({
      success: true,
      activities: activitiesWithCurrent
    });

  } catch (error) {
    console.error("Login activity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch login activity",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export const signOutAllDevices = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  try {
    // Deactivate all login sessions for this user
    await prisma.loginSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Destroy current session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to sign out"
        });
      }

      res.status(200).json({
        success: true,
        message: "Signed out from all devices successfully"
      });
    });

  } catch (error) {
    console.error("Sign out error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sign out from all devices",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

export const createJobSeekerProfile = asyncHandler(async (req, res) => {
  const userId = req.session.userId;
  const {
    profileType,
    bio,
    skills,
    education,
    experience,
    certifications,
    portfolio,
    visibility
  } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  // Verify user is a job seeker
  const user = await prisma.user.findUnique({
    where: { id: userId, userType: "JOB_SEEKER" }
  });

  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Only job seekers can create profiles"
    });
  }

  // Validation
  if (!profileType) {
    return res.status(400).json({
      success: false,
      message: "Profile type is required"
    });
  }

  if (!bio) {
    return res.status(400).json({
      success: false,
      message: "Bio is required"
    });
  }

  if (!education) {
    return res.status(400).json({
      success: false,
      message: "Education information is required"
    });
  }

  if (!skills || skills.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one skill is required"
    });
  }

  try {
    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId },
      update: {
        profileType,
        bio,
        skills: Array.isArray(skills) ? skills : [skills],
        education,
        experience,
        certifications,
        portfolio,
        visibility: visibility || "PRIVATE"
      },
      create: {
        userId,
        profileType,
        bio,
        skills: Array.isArray(skills) ? skills : [skills],
        education,
        experience,
        certifications,
        portfolio,
        visibility: visibility || "PRIVATE"
      }
    });

    res.json({
      success: true,
      message: "Profile saved successfully",
      profile
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Profile update failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==========================================
// JOB POSTING
// ==========================================

export const createJobPost = asyncHandler(async (req, res) => {
  const userId = req.session.userId;
  const {
    title,
    description,
    industry,
    jobType,
    location,
    salaryRange,
    requirements,
    skillsRequired,
    applicationDeadline,
    hasChatArea,
    experienceLevel,
    salaryMin,
    salaryMax,
    benefits,
    isRemote
  } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  // Verify user is a company
  const user = await prisma.user.findUnique({
    where: { id: userId, userType: "COMPANY" }
  });

  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Only companies can post jobs"
    });
  }

  // Validation
  if (!title || !description || !industry || !jobType || !applicationDeadline) {
    return res.status(400).json({
      success: false,
      message: "Title, description, industry, job type, and deadline are required"
    });
  }

  if (new Date(applicationDeadline) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Application deadline must be in the future"
    });
  }

  try {
    const jobPost = await prisma.jobPost.create({
      data: {
        title,
        description,
        companyId: userId,
        industry,
        jobType,
        location,
        salaryRange,
        requirements: Array.isArray(requirements) ? requirements : [requirements],
        skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [skillsRequired],
        applicationDeadline: new Date(applicationDeadline),
        hasChatArea: hasChatArea || false,
        experienceLevel,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        benefits: Array.isArray(benefits) ? benefits : [benefits],
        isRemote: isRemote || false
      }
    });

    res.status(201).json({
      success: true,
      message: "Job post created successfully",
      jobPost
    });

  } catch (error) {
    console.error("Job post error:", error);
    res.status(500).json({
      success: false,
      message: "Job post creation failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default {
  signup,
  registerJobseeker,
  registerCompany,
  createLoginSession,
  createJobSeekerProfile,
  createJobPost,
  getPrivacySettings,
  updatePrivacySettings,
  getLoginActivity,
  signOutAllDevices
};