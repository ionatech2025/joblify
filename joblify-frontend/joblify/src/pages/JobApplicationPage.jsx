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
import { motion } from "framer-motion"

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
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Link 
              to={`/jobs/${id}`} 
              className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
            >
              ← Back to Job Details
            </Link>

            <div className="mb-10">
              <h1 className="text-4xl font-semibold tracking-tight mb-2">
                Apply for {job.title}
              </h1>
              <p className="text-zinc-400 text-lg">
                {job.company} • {job.location}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-12">
              <div className="flex justify-between relative">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all ${
                        step >= s 
                          ? "bg-blue-600 text-white" 
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {s}
                    </div>
                    <span className={`text-sm mt-3 ${step >= s ? "text-white" : "text-zinc-500"}`}>
                      {s === 1 && "Personal Info"}
                      {s === 2 && "Documents"}
                      {s === 3 && "Review"}
                    </span>
                  </div>
                ))}
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-zinc-800 -z-10">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-10"
              >
                <h2 className="text-2xl font-semibold mb-8">Personal Information</h2>

                <form className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>First Name *</Label>
                      <Input className="h-14 bg-zinc-950 border-white/10 rounded-2xl" placeholder="John" />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input className="h-14 bg-zinc-950 border-white/10 rounded-2xl" placeholder="Doe" />
                    </div>
                  </div>

                  <div>
                    <Label>Email Address *</Label>
                    <Input type="email" className="h-14 bg-zinc-950 border-white/10 rounded-2xl" placeholder="john@example.com" />
                  </div>

                  <div>
                    <Label>Phone Number *</Label>
                    <Input type="tel" className="h-14 bg-zinc-950 border-white/10 rounded-2xl" placeholder="1234567890" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>City *</Label>
                      <Input className="h-14 bg-zinc-950 border-white/10 rounded-2xl" />
                    </div>
                    <div>
                      <Label>State / Country *</Label>
                      <Input className="h-14 bg-zinc-950 border-white/10 rounded-2xl" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="button" onClick={nextStep} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-lg">
                      Continue to Documents
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 2: Resume & Cover Letter */}
            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-10"
              >
                <h2 className="text-2xl font-semibold mb-8">Documents</h2>

                <form className="space-y-10">
                  {/* Resume Upload */}
                  <div>
                    <Label className="text-lg font-medium mb-3 block">Resume (Required)</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-3xl p-8 text-center hover:border-blue-500/50 transition-colors">
                      {resumeFile ? (
                        <div className="flex flex-col items-center">
                          <p className="font-medium text-green-400">✓ {resumeFile.name}</p>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setResumeFile(null)} className="mt-4">
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl mb-4">📄</div>
                          <p className="text-zinc-400 mb-2">Drag & drop your resume or click to upload</p>
                          <p className="text-sm text-zinc-500">PDF, DOCX up to 5MB</p>
                          <Input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            id="resume"
                            onChange={handleResumeChange}
                          />
                          <Button type="button" variant="outline" className="mt-6" onClick={() => document.getElementById('resume').click()}>
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter Upload */}
                  <div>
                    <Label className="text-lg font-medium mb-3 block">Cover Letter (Optional)</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-3xl p-8 text-center hover:border-blue-500/50 transition-colors">
                      {coverLetterFile ? (
                        <div className="flex flex-col items-center">
                          <p className="font-medium text-green-400">✓ {coverLetterFile.name}</p>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setCoverLetterFile(null)} className="mt-4">
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl mb-4">✍️</div>
                          <p className="text-zinc-400 mb-2">Drag & drop your cover letter</p>
                          <Input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            id="cover"
                            onChange={handleCoverLetterChange}
                          />
                          <Button type="button" variant="outline" className="mt-6" onClick={() => document.getElementById('cover').click()}>
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button type="button" variant="outline" onClick={prevStep} className="rounded-2xl">
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="rounded-2xl bg-blue-600 hover:bg-blue-500">
                      Continue to Review
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-10"
              >
                <h2 className="text-2xl font-semibold mb-8">Review Your Application</h2>

                <div className="space-y-10">
                  <div>
                    <h3 className="font-medium mb-4">Job Position</h3>
                    <div className="bg-zinc-800 p-6 rounded-2xl">
                      <p className="font-semibold text-lg">{job.title}</p>
                      <p className="text-zinc-400">{job.company} • {job.location}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Documents</h3>
                    <div className="space-y-4">
                      {resumeFile && (
                        <div className="flex items-center gap-4 bg-zinc-800 p-4 rounded-2xl">
                          <div className="text-3xl">📄</div>
                          <div>
                            <p className="font-medium">Resume</p>
                            <p className="text-sm text-zinc-400">{resumeFile.name}</p>
                          </div>
                        </div>
                      )}
                      {coverLetterFile && (
                        <div className="flex items-center gap-4 bg-zinc-800 p-4 rounded-2xl">
                          <div className="text-3xl">📝</div>
                          <div>
                            <p className="font-medium">Cover Letter</p>
                            <p className="text-sm text-zinc-400">{coverLetterFile.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <Checkbox id="confirm" className="mt-1" />
                    <label htmlFor="confirm" className="ml-3 text-sm text-zinc-300">
                      I confirm that all information provided is accurate and I agree to the terms.
                    </label>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button type="button" variant="outline" onClick={prevStep} className="rounded-2xl">
                      Back
                    </Button>
                    <Button type="submit" className="rounded-2xl bg-green-600 hover:bg-green-500 px-10">
                      Submit Application
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}