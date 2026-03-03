import express from "express";
import {
  signup,
  registerJobseeker,
  registerCompany,
  createLoginSession,
  getPrivacySettings,
  updatePrivacySettings,
  getLoginActivity,
  signOutAllDevices,
  createJobSeekerProfile,
  createJobPost
} from "../controllers/auth.controller.mjs";

const router = express.Router();

// ===========================================
// AUTH ROUTES
// ===========================================

// Unified signup endpoint (for your React frontend)
router.post("/signup", signup);

// Legacy registration endpoints (keep for backward compatibility)
router.post("/register/jobseeker", registerJobseeker);
router.post("/register/company", registerCompany);

// Login
router.post("/login", createLoginSession);

// ===========================================
// PROFILE & JOB ROUTES
// ===========================================

// Job Seeker Profile
router.post("/job-seeker/profile", createJobSeekerProfile);

// Job Posts
router.post("/jobs", createJobPost);

// ===========================================
// PRIVACY & SECURITY ROUTES
// ===========================================

router.get("/privacy-settings", getPrivacySettings);
router.put("/privacy-settings", updatePrivacySettings);
router.get("/login-activity", getLoginActivity);
router.post("/signout-all", signOutAllDevices);

export default router;