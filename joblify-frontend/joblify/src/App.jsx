import { Routes, Route, BrowserRouter } from "react-router-dom"
import HomePage from "./pages/HomePage"
import JobsPage from "./pages/JobsPage"
import JobDetailPage from "./pages/JobDetailPage"
import JobApplicationPage from "./pages/JobApplicationPage"
import PostJobPage from "./pages/PostJobPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignUpPage"
import CompaniesPage from "./pages/CompaniesPage"
import ResourcesPage from "./pages/ResourcesPage"
import AboutUsPage from "./pages/AboutUsPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import JobseekerDashboardPage from "./pages/JobseekerDashboardPage"
import CompanyDashboardPage from "./pages/CompanyDashboardPage"
import JobseekerProfilePage from "./pages/JobseekerProfilePage"
import CompanyProfilePage from "./pages/CompanyProfilePage"
import CompaniesListingPage from "./pages/CompaniesListingPage"
import CompanySubscriptionPage from "./pages/CompanySubscriptionPage"
import ApplicationTrackingPage from "./pages/ApplicationTrackingPage"
import JobseekersListingPage from "./pages/JobseekersListingPage"
import InvitationsPage from "./pages/InvitationsPage"
import MyJobPostsPage from "./pages/MyJobPostsPage"
import ManageApplicantsPage from "./pages/ManageApplicantsPage"
import JobChatPage from "./pages/JobChatPage"
import MyApplicationsPage from "./pages/MyApplicationsPage"
import NotificationsPage from "./pages/NotificationsPage"
import JobseekerProfileViewPage from "./pages/JobseekerProfileViewPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/jobs/:id/apply" element={<JobApplicationPage />} />
        <Route path="/post-job" element={<PostJobPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/dashboard/jobseeker" element={<JobseekerDashboardPage />} />
        <Route path="/dashboard/company" element={<CompanyDashboardPage />} />
        <Route path="/profile" element={<JobseekerProfilePage />} />
        <Route path="/company/profile" element={<CompanyProfilePage />} />
        <Route path="/companies" element={<CompaniesListingPage />} />
        <Route path="/companies/:companyId/subscribe" element={<CompanySubscriptionPage />} />
        <Route path="/applications" element={<ApplicationTrackingPage />} />
        <Route path="/jobseekers" element={<JobseekersListingPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/my-job-posts" element={<MyJobPostsPage />} />
        <Route path="/job-posts/:jobId/applicants" element={<ManageApplicantsPage />} />
        <Route path="/chat/:jobId" element={<JobChatPage />} />
        <Route path="/my-applications" element={<MyApplicationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/jobseekers/:jobseekerId" element={<JobseekerProfileViewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App