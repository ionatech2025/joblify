"use client"

import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"

// Mock job data
const job = {
  id: "1",
  title: "Frontend Developer",
  company: "TechCorp",
  location: "San Francisco, CA",
}

export default function JobApplicationPage() {
  const { id } = useParams()
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState(null)
  const [coverLetterFile, setCoverLetterFile] = useState(null)

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
    }
  }

  const handleCoverLetterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverLetterFile(e.target.files[0])
    }
  }

  const nextStep = () => {
    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Link to={`/jobs/${id}`} className="inline-flex items-center text-primary hover:underline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Back to Job Details
              </Link>
              <h1 className="text-3xl font-bold mt-4">Apply for {job.title}</h1>
              <p className="text-muted-foreground">
                {job.company} • {job.location}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between">
                <div className={`flex flex-col items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    1
                  </div>
                  <span className="text-sm">Personal Info</span>
                </div>
                <div className="flex-1 flex items-center mx-2">
                  <div className={`h-1 w-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
                </div>
                <div className={`flex flex-col items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    2
                  </div>
                  <span className="text-sm">Resume & Cover Letter</span>
                </div>
                <div className="flex-1 flex items-center mx-2">
                  <div className={`h-1 w-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
                </div>
                <div className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    3
                  </div>
                  <span className="text-sm">Review & Submit</span>
                </div>
              </div>
            </div>

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" required />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" required />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
                    <Input id="linkedin" placeholder="https://linkedin.com/in/yourprofile" />
                  </div>

                  <div>
                    <Label htmlFor="portfolio">Portfolio/Website (Optional)</Label>
                    <Input id="portfolio" placeholder="https://yourwebsite.com" />
                  </div>

                  <div className="pt-4">
                    <Button type="button" onClick={nextStep}>
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Resume & Cover Letter */}
            {step === 2 && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-6">Resume & Cover Letter</h2>

                <form className="space-y-6">
                  <div>
                    <Label htmlFor="resume" className="mb-2 block">
                      Resume
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {resumeFile ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5 text-primary"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                          </div>
                          <span>{resumeFile.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setResumeFile(null)}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-8 w-8 mx-auto mb-2 text-muted-foreground"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                          </svg>
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop your resume, or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Supported formats: PDF, DOCX, RTF (Max 5MB)
                          </p>
                          <Input
                            id="resume"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.rtf"
                            onChange={handleResumeChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("resume")?.click()}
                          >
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cover-letter" className="mb-2 block">
                      Cover Letter (Optional)
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {coverLetterFile ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5 text-primary"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                          </div>
                          <span>{coverLetterFile.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setCoverLetterFile(null)}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-8 w-8 mx-auto mb-2 text-muted-foreground"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                          </svg>
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop your cover letter, or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Supported formats: PDF, DOCX, RTF (Max 5MB)
                          </p>
                          <Input
                            id="cover-letter"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.rtf"
                            onChange={handleCoverLetterChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("cover-letter")?.click()}
                          >
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additional-info" className="mb-2 block">
                      Additional Information (Optional)
                    </Label>
                    <Textarea
                      id="additional-info"
                      placeholder="Share anything else that might be relevant to your application..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Job Details</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-muted-foreground">
                        {job.company} • {job.location}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Attached Documents</h3>
                    <div className="space-y-2">
                      {resumeFile && (
                        <div className="flex items-center p-3 bg-muted rounded-lg">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-primary"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Resume</p>
                            <p className="text-xs text-muted-foreground">{resumeFile.name}</p>
                          </div>
                        </div>
                      )}

                      {coverLetterFile && (
                        <div className="flex items-center p-3 bg-muted rounded-lg">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-primary"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Cover Letter</p>
                            <p className="text-xs text-muted-foreground">{coverLetterFile.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-4">
                    <Checkbox id="terms" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By submitting this application, I certify that the information provided is accurate and
                        complete.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button type="submit">Submit Application</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

