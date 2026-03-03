"use client"

import { Link, useParams } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"

// Mock job data
const job = {
  id: "1",
  title: "Frontend Developer",
  company: "TechCorp",
  companyDescription:
    "TechCorp is a leading technology company specializing in innovative software solutions for businesses of all sizes. With a team of talented professionals, we create cutting-edge products that help our clients succeed in the digital world.",
  location: "San Francisco, CA",
  type: "Full-time",
  salary: "$90,000 - $120,000",
  description:
    "We are looking for a skilled Frontend Developer to join our team and help us build beautiful, responsive web applications. The ideal candidate will have a strong understanding of modern frontend technologies and a passion for creating exceptional user experiences.",
  responsibilities: [
    "Develop and maintain responsive web applications using React, JavaScript, and other modern frontend technologies",
    "Collaborate with designers to implement user interfaces that are both visually appealing and functional",
    "Work with backend developers to integrate frontend components with APIs and services",
    "Optimize applications for maximum speed and scalability",
    "Ensure cross-browser compatibility and responsive design",
    "Participate in code reviews and contribute to team knowledge sharing",
  ],
  requirements: [
    "3+ years of experience with React and modern JavaScript",
    "Strong JavaScript skills",
    "Experience with responsive design and CSS frameworks like Tailwind",
    "Familiarity with version control systems (Git)",
    "Good understanding of web performance optimization techniques",
    "Excellent problem-solving skills and attention to detail",
    "Bachelor's degree in Computer Science or related field (or equivalent experience)",
  ],
  benefits: [
    "Competitive salary and equity options",
    "Health, dental, and vision insurance",
    "Flexible work hours and remote work options",
    "Professional development budget",
    "401(k) matching",
    "Generous paid time off",
    "Modern office with snacks and beverages",
  ],
  postedDate: "2023-05-15",
}

export default function JobDetailPage() {
  const { id } = useParams()

  // In a real app, you would fetch the job data based on the ID

  // Calculate days ago
  const postedDate = new Date(job.postedDate)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - postedDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Job Header */}
            <div className="bg-card rounded-lg shadow-sm border p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <p className="text-xl mb-4">{job.company}</p>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-muted-foreground">
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
                        className="h-5 w-5 mr-2"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
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
                        className="h-5 w-5 mr-2"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span>{job.type}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
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
                        className="h-5 w-5 mr-2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
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
                        className="h-5 w-5 mr-2"
                      >
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      <span>
                        Posted {diffDays} {diffDays === 1 ? "day" : "days"} ago
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{job.type}</Badge>
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">JavaScript</Badge>
                    <Badge variant="outline">Frontend</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full md:w-auto">
                    Apply Now
                  </Button>
                  <Button variant="outline" size="lg" className="w-full md:w-auto">
                    Save Job
                  </Button>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
                  <p className="text-muted-foreground mb-6">{job.description}</p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Responsibilities</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index}>{responsibility}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {job.requirements.map((requirement, index) => (
                      <li key={index}>{requirement}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Benefits</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </section>

                <div className="pt-6 border-t">
                  <Button size="lg">Apply Now</Button>
                </div>
              </div>

              <div>
                <div className="bg-card rounded-lg shadow-sm border p-6 sticky top-6">
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>

                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
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
                        className="h-6 w-6 text-primary"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{job.company}</p>
                      <p className="text-sm text-muted-foreground">{job.location}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{job.companyDescription}</p>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/companies/${job.company.toLowerCase().replace(/\s+/g, "-")}`}>
                      View Company Profile
                    </Link>
                  </Button>

                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Job Details</h4>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employment Type:</span>
                        <span className="font-medium">{job.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Salary Range:</span>
                        <span className="font-medium">{job.salary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Posted:</span>
                        <span className="font-medium">{diffDays} days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

