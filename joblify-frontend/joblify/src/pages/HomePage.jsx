import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { JobCard } from "../components/JobCard"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { SearchBar } from "../components/SearchBar"

// Mock data for featured jobs
const featuredJobs = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$90,000 - $120,000",
    description: "We are looking for a skilled Frontend Developer to join our team and help build amazing user experiences...",
    requirements: ["3+ years of React experience", "Strong JavaScript skills", "Experience with responsive design"],
    postedDate: "2023-05-15",
  },
  {
    id: "2",
    title: "Backend Engineer",
    company: "DataSystems",
    location: "Remote",
    type: "Full-time",
    salary: "$100,000 - $130,000",
    description: "Join our backend team to build scalable APIs and services that power millions of users worldwide...",
    requirements: ["Experience with Node.js", "Database design skills", "Knowledge of cloud services"],
    postedDate: "2023-05-10",
  },
  {
    id: "3",
    title: "UX/UI Designer",
    company: "CreativeMinds",
    location: "New York, NY",
    type: "Contract",
    salary: "$70 - $90 per hour",
    description: "Design beautiful and intuitive user interfaces for our products that delight users and drive engagement...",
    requirements: ["Portfolio showcasing UI/UX work", "Proficiency in Figma", "Understanding of user research"],
    postedDate: "2023-05-12",
  },
]

// Testimonials data
const testimonials = [
  {
    id: 1,
    quote:
      "Joblify helped me find my dream job in just two weeks. The platform is intuitive and the job recommendations were spot on!",
    name: "Alex Johnson",
    title: "Software Engineer",
    company: "TechCorp",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "As a hiring manager, Joblify has transformed our recruitment process. We've found amazing talent quickly and efficiently.",
    name: "Sarah Williams",
    title: "HR Director",
    company: "InnovateTech",
    avatar: "https://randomuser.me/api/portraits/women/63.jpg",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "The career resources and salary insights helped me negotiate a 15% higher offer. I couldn't be more grateful!",
    name: "Michael Chen",
    title: "Product Manager",
    company: "DataSystems",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 5,
  },
]

// Stats data
const stats = [
  { label: "Active Job Listings", value: "10,000+", icon: "💼" },
  { label: "Companies Hiring", value: "2,500+", icon: "🏢" },
  { label: "Successful Placements", value: "50,000+", icon: "🎯" },
  { label: "Candidate Success Rate", value: "94%", icon: "⭐" },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white py-24 lg:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-pattern-blue-dots opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-200/30 rounded-full blur-2xl animate-float delay-500"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-bounce-in">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                  Find Your{" "}
                  <span className="text-5xl md:text-6xl font-bold mb-6 text-yellow-300 text-center">
                    Dream Job
                  </span>{" "}
                  Today
                </h1>
                <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-95 leading-relaxed">
                  Connect with top employers and discover opportunities that match your skills and career goals.
                  Join thousands of professionals who have found success with Joblify.
                </p>
              </div>
              
              <div className="animate-slide-up">
                <SearchBar />
              </div>
              
              <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-in">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl text-lg px-8 py-4 transition-all duration-300 transform hover:scale-105">
                  <Link to="/jobs">Browse All Jobs</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/40 text-white hover:bg-white/20 hover:border-white/60 text-lg px-8 py-4 transition-all duration-300 transform hover:scale-105"
                >
                  <Link to="/post-job">Post a Job</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="container mx-auto px-4 mt-20 relative z-10">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 md:p-10 border border-white/30 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-3 group">
                    <div className="text-4xl md:text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm md:text-base opacity-90 font-medium text-blue-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Featured Jobs Section */}
        <section className="py-20 bg-blue-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-gradient">
                Featured Job Opportunities
              </h2>
              <p className="text-xl text-blue-800 max-w-3xl mx-auto leading-relaxed">
                Discover top positions from leading companies that are hiring right now. 
                These opportunities are carefully curated for the best candidates.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {featuredJobs.map((job, index) => (
                <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button asChild size="lg" className="btn-blue-outline text-lg px-8 py-4">
                <Link to="/jobs">View All Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-gradient">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Join thousands of professionals who have found success with Joblify. 
                Here's what they have to say about their experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id} 
                  className="card-elegant p-8 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 inline-block text-yellow-500 mr-1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  
                  <blockquote className="text-lg mb-8 flex-1 italic leading-relaxed text-muted-foreground">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full mr-4 border-2 border-primary/20"
                    />
                    <div>
                      <p className="font-semibold text-lg">{testimonial.name}</p>
                      <p className="text-muted-foreground">
                        {testimonial.title}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-muted to-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-gradient">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Profile",
                  description: "Sign up and build your professional profile to showcase your skills and experience.",
                  icon: "👤",
                },
                {
                  step: "2",
                  title: "Discover Opportunities",
                  description: "Browse through job listings or use our smart search to find the perfect match.",
                  icon: "🔍",
                },
                {
                  step: "3",
                  title: "Apply with Ease",
                  description: "Submit your application with just a few clicks and track your application status.",
                  icon: "📝",
                },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="card-elegant text-center p-8 hover-lift animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced For Employers Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gradient">
                  For Employers
                </h2>
                <p className="text-xl mb-8 text-muted-foreground leading-relaxed">
                  Post job opportunities and find the perfect candidates for your company. Our platform connects you
                  with qualified professionals ready to contribute to your success.
                </p>
                <ul className="space-y-6 mb-10">
                  {[
                    "Reach thousands of qualified candidates",
                    "Streamlined hiring process",
                    "Advanced candidate filtering",
                    "Analytics and insights",
                    "Dedicated support team"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-primary"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-lg text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="btn-primary-gradient text-lg px-8 py-4">
                  <Link to="/employer-signup">Get Started</Link>
                </Button>
              </div>
              
              <div className="lg:w-1/2">
                <div className="card-elegant p-8 shadow-2xl">
                  <h3 className="text-2xl font-semibold mb-6 text-foreground">Post Your First Job</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Create an employer account and post your first job listing for free.
                  </p>
                  <div className="space-y-6">
                    {[
                      {
                        icon: "🏢",
                        title: "Create a company profile",
                        description: "Showcase your brand and company culture"
                      },
                      {
                        icon: "📋",
                        title: "Post detailed job listings",
                        description: "Specify requirements and responsibilities"
                      },
                      {
                        icon: "👥",
                        title: "Review applicants",
                        description: "Evaluate candidates and schedule interviews"
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0 text-2xl">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-8 btn-primary-gradient">
                    <Link to="/post-job">Post a Job</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Take the Next Step in Your Career?
            </h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Join thousands of professionals who have found their <span className="text-yellow-200">dream jobs</span> through Joblify. 
              Start your journey today and unlock new opportunities.
            </p>
            <Button asChild size="lg" className="btn-primary-gradient text-lg px-10 py-5">
              <Link to="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}