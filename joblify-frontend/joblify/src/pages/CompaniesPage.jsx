"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"

// Update the company logo placeholders
const companies = [
  {
    id: "1",
    name: "TechCorp",
    logo: "https://placehold.co/100x100/4F46E5/FFFFFF?text=TC",
    industry: "Technology",
    location: "San Francisco, CA",
    description:
      "A leading technology company specializing in innovative software solutions for businesses of all sizes.",
    employees: "500-1000",
    founded: "2010",
    openPositions: 12,
    benefits: ["Health Insurance", "Remote Work", "401(k) Matching", "Professional Development"],
  },
  {
    id: "2",
    name: "DataSystems",
    logo: "https://placehold.co/100x100/22C55E/FFFFFF?text=DS",
    industry: "Data Analytics",
    location: "Remote",
    description:
      "Specializing in big data solutions and analytics platforms that help businesses make data-driven decisions.",
    employees: "100-500",
    founded: "2015",
    openPositions: 8,
    benefits: ["Flexible Hours", "Health Benefits", "Stock Options", "Unlimited PTO"],
  },
  {
    id: "3",
    name: "CreativeMinds",
    logo: "https://placehold.co/100x100/EC4899/FFFFFF?text=CM",
    industry: "Design & Creative",
    location: "New York, NY",
    description: "A creative agency focused on delivering exceptional design solutions and brand experiences.",
    employees: "50-100",
    founded: "2012",
    openPositions: 5,
    benefits: ["Creative Workspace", "Health Insurance", "Flexible Schedule", "Learning Budget"],
  },
  {
    id: "4",
    name: "CloudTech",
    logo: "https://placehold.co/100x100/3B82F6/FFFFFF?text=CT",
    industry: "Cloud Services",
    location: "Chicago, IL",
    description: "Providing innovative cloud infrastructure and solutions to businesses worldwide.",
    employees: "1000+",
    founded: "2008",
    openPositions: 15,
    benefits: ["Competitive Salary", "Remote Work Options", "Health & Wellness Programs", "Career Growth"],
  },
  {
    id: "5",
    name: "AnalyticsPro",
    logo: "https://placehold.co/100x100/F59E0B/FFFFFF?text=AP",
    industry: "Data Science",
    location: "Boston, MA",
    description: "Specializing in advanced analytics and machine learning solutions for enterprise clients.",
    employees: "100-500",
    founded: "2014",
    openPositions: 7,
    benefits: ["Flexible Work Hours", "Health Insurance", "Professional Development", "Parental Leave"],
  },
  {
    id: "6",
    name: "InnovateTech",
    logo: "https://placehold.co/100x100/EF4444/FFFFFF?text=IT",
    industry: "Product Development",
    location: "Seattle, WA",
    description: "An innovation-focused company building next-generation products and services.",
    employees: "500-1000",
    founded: "2011",
    openPositions: 10,
    benefits: ["Competitive Salary", "Stock Options", "Health Benefits", "Work-Life Balance"],
  },
]

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("")

  // Filter companies based on search term and industry filter
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = industryFilter === "" || company.industry === industryFilter
    return matchesSearch && matchesIndustry
  })

  // Get unique industries for filter dropdown
  const industries = [...new Set(companies.map((company) => company.industry))]

  // Improve mobile responsiveness in the search section
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-yellow-200 text-center">Discover Top Companies Hiring Now</h1>
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <Input
                    type="text"
                    placeholder="Search companies by name or keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white text-foreground"
                  />
                </div>
                <select
                  className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                <Button type="button" size="lg" className="h-12">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold mb-4 sm:mb-0">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? "Company" : "Companies"} Found
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select className="text-sm border rounded p-1">
                  <option>Most Relevant</option>
                  <option>Most Jobs</option>
                  <option>Alphabetical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="bg-card rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mr-4">
                        <img
                          src={company.logo || "/placeholder.svg"}
                          alt={`${company.name} logo`}
                          className="max-w-full max-h-full rounded-md"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          <Link to={`/companies/${company.id}`} className="hover:text-primary transition-colors">
                            {company.name}
                          </Link>
                        </h3>
                        <p className="text-muted-foreground">{company.industry}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
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
                          className="h-4 w-4 mr-2"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{company.location}</span>
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
                          className="h-4 w-4 mr-2"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>{company.employees} employees</span>
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
                          className="h-4 w-4 mr-2"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span>Founded in {company.founded}</span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">{company.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {company.benefits.slice(0, 2).map((benefit, index) => (
                        <Badge key={index} variant="outline">
                          {benefit}
                        </Badge>
                      ))}
                      {company.benefits.length > 2 && (
                        <Badge variant="outline">+{company.benefits.length - 2} more</Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {company.openPositions} open positions
                      </Badge>
                      <Button asChild variant="outline">
                        <Link to={`/companies/${company.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No companies found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setIndustryFilter("")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}