import React, { useState, useEffect } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Users, 
  Globe, 
  Linkedin,
  Briefcase,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  ArrowLeft,
  ExternalLink
} from "lucide-react"

export default function CompaniesListingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State management
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showCompanyDetail, setShowCompanyDetail] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(12)
  
  // Available filters
  const industries = [
    "Information Technology",
    "Healthcare",
    "Finance & Banking",
    "Manufacturing",
    "Retail & E-commerce",
    "Education",
    "Hospitality & Tourism",
    "Real Estate",
    "Transportation & Logistics",
    "Energy & Utilities",
    "Media & Entertainment",
    "Consulting & Professional Services",
    "Non-profit & Government",
    "Agriculture & Food",
    "Construction & Engineering",
    "Automotive",
    "Telecommunications",
    "Biotechnology & Pharmaceuticals",
    "Aerospace & Defense"
  ]

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ]

  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Boston, MA",
    "Denver, CO",
    "Chicago, IL",
    "Los Angeles, CA",
    "Atlanta, GA",
    "Portland, OR",
    "Remote",
    "Hybrid"
  ]

  // Mock company data
  const mockCompanies = [
    {
      id: 1,
      name: "TechCorp Solutions",
      industry: "Information Technology",
      size: "201-500",
      location: "San Francisco, CA",
      description: "Leading software development company specializing in cloud solutions and AI applications. We're passionate about innovation and creating technology that makes a difference.",
      yearEstablished: 2018,
      logo: null,
      website: "https://techcorp.com",
      linkedin: "https://linkedin.com/company/techcorp",
      rating: 4.5,
      activeJobs: 8,
      verified: true,
      suspended: false
    },
    {
      id: 2,
      name: "HealthFirst Medical",
      industry: "Healthcare",
      size: "501-1000",
      location: "Boston, MA",
      description: "Innovative healthcare provider focused on patient-centered care and cutting-edge medical technology. Committed to improving health outcomes through research and compassionate care.",
      yearEstablished: 2015,
      logo: null,
      website: "https://healthfirst.com",
      linkedin: "https://linkedin.com/company/healthfirst",
      rating: 4.8,
      activeJobs: 12,
      verified: true,
      suspended: false
    },
    {
      id: 3,
      name: "GreenEnergy Co",
      industry: "Energy & Utilities",
      size: "1000+",
      location: "Denver, CO",
      description: "Sustainable energy company dedicated to renewable power solutions. We're building a cleaner future through solar, wind, and innovative energy storage technologies.",
      yearEstablished: 2010,
      logo: null,
      website: "https://greenenergy.com",
      linkedin: "https://linkedin.com/company/greenenergy",
      rating: 4.3,
      activeJobs: 15,
      verified: true,
      suspended: false
    },
    {
      id: 4,
      name: "EduTech Innovations",
      industry: "Education",
      size: "51-200",
      location: "Austin, TX",
      description: "Revolutionizing education through technology. We create interactive learning platforms that make education accessible, engaging, and effective for students worldwide.",
      yearEstablished: 2020,
      logo: null,
      website: "https://edutech.com",
      linkedin: "https://linkedin.com/company/edutech",
      rating: 4.6,
      activeJobs: 6,
      verified: true,
      suspended: false
    },
    {
      id: 5,
      name: "FinServe Capital",
      industry: "Finance & Banking",
      size: "201-500",
      location: "New York, NY",
      description: "Modern financial services firm providing innovative banking solutions, investment strategies, and wealth management services for individuals and businesses.",
      yearEstablished: 2012,
      logo: null,
      website: "https://finserve.com",
      linkedin: "https://linkedin.com/company/finserve",
      rating: 4.4,
      activeJobs: 10,
      verified: true,
      suspended: false
    },
    {
      id: 6,
      name: "Creative Studios",
      industry: "Media & Entertainment",
      size: "11-50",
      location: "Los Angeles, CA",
      description: "Award-winning creative agency specializing in digital content, video production, and brand storytelling. We help brands connect with their audiences through compelling narratives.",
      yearEstablished: 2019,
      logo: null,
      website: "https://creativestudios.com",
      linkedin: "https://linkedin.com/company/creativestudios",
      rating: 4.7,
      activeJobs: 4,
      verified: true,
      suspended: false
    },
    {
      id: 7,
      name: "ManufacturePro",
      industry: "Manufacturing",
      size: "501-1000",
      location: "Detroit, MI",
      description: "Advanced manufacturing company specializing in automotive components and industrial automation. We're driving the future of manufacturing with smart technology and precision engineering.",
      yearEstablished: 2008,
      logo: null,
      website: "https://manufacturepro.com",
      linkedin: "https://linkedin.com/company/manufacturepro",
      rating: 4.2,
      activeJobs: 18,
      verified: true,
      suspended: false
    },
    {
      id: 8,
      name: "RetailHub",
      industry: "Retail & E-commerce",
      size: "1000+",
      location: "Seattle, WA",
      description: "Omnichannel retail platform connecting consumers with quality products. We're redefining shopping experiences through technology, convenience, and exceptional customer service.",
      yearEstablished: 2016,
      logo: null,
      website: "https://retailhub.com",
      linkedin: "https://linkedin.com/company/retailhub",
      rating: 4.1,
      activeJobs: 22,
      verified: true,
      suspended: false
    }
  ]

  // Mock job listings for companies
  const mockJobs = {
    1: [
      { id: 1, title: "Senior Software Engineer", type: "Full-time", location: "San Francisco, CA", salary: "$120k - $180k", postedDate: "2024-01-15" },
      { id: 2, title: "Frontend Developer", type: "Full-time", location: "Remote", salary: "$90k - $130k", postedDate: "2024-01-14" },
      { id: 3, title: "DevOps Engineer", type: "Full-time", location: "San Francisco, CA", salary: "$110k - $160k", postedDate: "2024-01-13" }
    ],
    2: [
      { id: 4, title: "Registered Nurse", type: "Full-time", location: "Boston, MA", salary: "$70k - $90k", postedDate: "2024-01-15" },
      { id: 5, title: "Medical Technologist", type: "Full-time", location: "Boston, MA", salary: "$60k - $80k", postedDate: "2024-01-14" }
    ],
    3: [
      { id: 6, title: "Solar Engineer", type: "Full-time", location: "Denver, CO", salary: "$80k - $120k", postedDate: "2024-01-15" },
      { id: 7, title: "Energy Analyst", type: "Full-time", location: "Denver, CO", salary: "$70k - $100k", postedDate: "2024-01-14" }
    ]
  }

  // Get company initials for avatar
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Filter out suspended and unverified companies
        const validCompanies = mockCompanies.filter(company => 
          company.verified && !company.suspended
        )
        
        setCompanies(validCompanies)
        setFilteredCompanies(validCompanies)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading companies:", error)
        setIsLoading(false)
      }
    }

    loadCompanies()
  }, [])

  // Apply search and filters
  useEffect(() => {
    let filtered = companies

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(company => company.industry === selectedIndustry)
    }

    // Apply size filter
    if (selectedSize) {
      filtered = filtered.filter(company => company.size === selectedSize)
    }

    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(company => company.location === selectedLocation)
    }

    setFilteredCompanies(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [companies, searchQuery, selectedIndustry, selectedSize, selectedLocation])

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      return
    }
    // Search is already handled by useEffect
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedIndustry("")
    setSelectedSize("")
    setSelectedLocation("")
  }

  // View company details
  const viewCompanyDetail = (company) => {
    setSelectedCompany(company)
    setShowCompanyDetail(true)
  }

  // Close company detail view
  const closeCompanyDetail = () => {
    setShowCompanyDetail(false)
    setSelectedCompany(null)
  }

  // Pagination calculations
  const indexOfLastCompany = currentPage * companiesPerPage
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany)
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/jobseeker")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Explore Companies
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover amazing companies, explore their culture, and find your next opportunity
            </p>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search companies by name, industry, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Industry Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Industry</Label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Industries</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Size Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Company Size</Label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Sizes</option>
                      {companySizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Location</Label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    >
                      <option value="">All Locations</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-transparent">Reset</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full h-12 border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing {filteredCompanies.length} of {companies.length} companies
            </p>
            {filteredCompanies.length === 0 && (
              <p className="text-red-500 font-medium">No companies match your criteria</p>
            )}
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentCompanies.map((company) => (
              <Card 
                key={company.id} 
                className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-primary/30 bg-white/95 backdrop-blur-sm"
                onClick={() => viewCompanyDetail(company)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={company.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {getCompanyInitials(company.name)}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {company.name}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {company.industry}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Company Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{company.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">{company.size} employees</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">Est. {company.yearEstablished}</span>
                    </div>
                  </div>

                  {/* Rating and Jobs */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{company.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {company.activeJobs} active jobs
                    </Badge>
                  </div>

                  {/* Description Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {company.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewCompanyDetail(company)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-2 border-secondary/50 hover:border-secondary/70 hover:bg-secondary/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/companies/${company.id}/subscribe`)
                      }}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Subscribe/Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Button
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <Button
                  key={number}
                  variant={currentPage === number ? "default" : "outline"}
                  onClick={() => paginate(number)}
                  className="px-3"
                >
                  {number}
                </Button>
              ))}
              
              <Button
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Company Detail Modal */}
      {showCompanyDetail && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                    {selectedCompany.logo ? (
                      <img 
                        src={selectedCompany.logo} 
                        alt={selectedCompany.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {getCompanyInitials(selectedCompany.name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {selectedCompany.name}
                    </h2>
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <span className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        {selectedCompany.industry}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedCompany.location}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {selectedCompany.size} employees
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeCompanyDetail}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Company Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">About {selectedCompany.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedCompany.description}
                    </p>
                  </div>

                  {/* Company Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <div className="text-2xl font-bold text-primary">{selectedCompany.yearEstablished}</div>
                      <div className="text-sm text-muted-foreground">Year Established</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <div className="text-2xl font-bold text-primary">{selectedCompany.rating}</div>
                      <div className="text-sm text-muted-foreground">Company Rating</div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedCompany.website && (
                        <a 
                          href={selectedCompany.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visit Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedCompany.linkedin && (
                        <a 
                          href={selectedCompany.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary hover:underline"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-primary/80"
                        onClick={() => navigate(`/companies/${selectedCompany.id}/subscribe`)}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Subscribe/Apply
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Follow Company
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Job Listings */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Active Job Openings</h3>
                {mockJobs[selectedCompany.id] ? (
                  <div className="space-y-3">
                    {mockJobs[selectedCompany.id].map((job) => (
                      <Card key={job.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{job.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {job.location}
                                </span>
                                <span>{job.type}</span>
                                <span>{job.salary}</span>
                                <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button className="bg-gradient-to-r from-primary to-primary/80">
                              Apply Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No active job openings at the moment. Check back later!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  )
} 