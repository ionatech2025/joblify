"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"

// Update the resources with real image URLs
const resources = [
  {
    id: "1",
    title: "How to Write a Resume That Will Get You Noticed",
    category: "Resume Tips",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&h=400&auto=format&fit=crop",
    author: "Jane Smith",
    authorRole: "Career Coach",
    date: "2023-05-10",
    readTime: "8 min read",
    excerpt:
      "Learn the essential elements of a standout resume and how to highlight your skills and experience effectively.",
    tags: ["Resume", "Job Search", "Career Advice"],
  },
  {
    id: "2",
    title: "10 Common Interview Questions and How to Answer Them",
    category: "Interview Preparation",
    image: "https://images.unsplash.com/photo-1573497161161-c3e73707e25c?q=80&w=800&h=400&auto=format&fit=crop",
    author: "Michael Johnson",
    authorRole: "HR Specialist",
    date: "2023-05-05",
    readTime: "12 min read",
    excerpt:
      "Prepare for your next interview with these common questions and expert tips on how to craft compelling answers.",
    tags: ["Interview", "Job Search", "Career Advice"],
  },
  {
    id: "3",
    title: "Negotiating Your Salary: A Complete Guide",
    category: "Career Development",
    image: "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=800&h=400&auto=format&fit=crop",
    author: "Sarah Williams",
    authorRole: "Compensation Specialist",
    date: "2023-04-28",
    readTime: "10 min read",
    excerpt:
      "Learn effective strategies for negotiating your salary and benefits package to ensure you're compensated fairly.",
    tags: ["Salary", "Negotiation", "Career Advice"],
  },
  {
    id: "4",
    title: "Building a Professional Network That Works for You",
    category: "Networking",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&h=400&auto=format&fit=crop",
    author: "David Chen",
    authorRole: "Career Strategist",
    date: "2023-04-20",
    readTime: "7 min read",
    excerpt: "Discover effective networking strategies that can help you build meaningful professional relationships.",
    tags: ["Networking", "Career Growth", "Professional Development"],
  },
  {
    id: "5",
    title: "Mastering Remote Work: Tips for Productivity and Balance",
    category: "Work Life",
    image: "https://images.unsplash.com/photo-1584677626646-7c8f83690304?q=80&w=800&h=400&auto=format&fit=crop",
    author: "Emily Rodriguez",
    authorRole: "Remote Work Consultant",
    date: "2023-04-15",
    readTime: "9 min read",
    excerpt: "Learn how to stay productive, maintain work-life balance, and thrive in a remote work environment.",
    tags: ["Remote Work", "Productivity", "Work-Life Balance"],
  },
  {
    id: "6",
    title: "Changing Careers: A Step-by-Step Guide",
    category: "Career Development",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&h=400&auto=format&fit=crop",
    author: "Robert Taylor",
    authorRole: "Career Transition Coach",
    date: "2023-04-08",
    readTime: "11 min read",
    excerpt:
      "Considering a career change? Follow this comprehensive guide to make a successful transition to a new field.",
    tags: ["Career Change", "Professional Development", "Job Search"],
  },
]

// Get unique categories
const categories = ["All", ...new Set(resources.map((resource) => resource.category))]

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  // Filter resources based on search term and category
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "All" || resource.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-yellow-200">Career Resources & Guides</h1>
              <p className="text-xl mb-8">Expert advice to help you navigate your job search and advance your career</p>
              <div className="relative">
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
                  placeholder="Search for resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white text-foreground w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Improve mobile responsiveness in the category buttons section */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex space-x-2 min-w-max pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    onClick={() => setActiveCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {filteredResources.length > 0 ? (
              // Improve the resource cards for better responsiveness
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={resource.image || "/placeholder.svg"}
                        alt={resource.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center mb-3">
                        <Badge variant="outline">{resource.category}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{resource.readTime}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        <Link to={`/resources/${resource.id}`} className="hover:text-primary transition-colors">
                          {resource.title}
                        </Link>
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">{resource.excerpt}</p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                            <span className="text-primary font-medium text-sm">
                              {resource.author
                                .split(" ")
                                .map((name) => name[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{resource.author}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(resource.date)}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/resources/${resource.id}`}>Read More</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or category selection</p>
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setActiveCategory("All")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Improve newsletter subscription for mobile */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold mb-4">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our career experts are constantly creating new resources to help you succeed in your job search.
                Subscribe to our newsletter to get the latest articles and guides.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input type="email" placeholder="Enter your email" className="flex-1" />
                <Button type="submit" className="sm:w-auto w-full">
                  Subscribe
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