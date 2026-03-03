import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"

// Update team members with real image URLs
const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Co-Founder",
    image: "https://randomuser.me/api/portraits/women/23.jpg",
    bio: "Sarah has over 15 years of experience in HR and recruitment. She founded Joblify with a mission to transform how people find their dream careers.",
  },
  {
    name: "Michael Chen",
    role: "CTO & Co-Founder",
    image: "https://randomuser.me/api/portraits/men/54.jpg",
    bio: "With a background in software engineering at leading tech companies, Michael leads our technology team to build innovative solutions for job seekers and employers.",
  },
  {
    name: "Jessica Rodriguez",
    role: "Head of Product",
    image: "https://randomuser.me/api/portraits/women/45.jpg",
    bio: "Jessica brings her expertise in UX design and product management to ensure Joblify delivers an exceptional experience for all users.",
  },
  {
    name: "David Kim",
    role: "Head of Marketing",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "David's background in digital marketing helps Joblify connect with job seekers and employers through strategic campaigns and partnerships.",
  },
]

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-yellow-200">
              About Joblify
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              We're on a mission to connect talented professionals with their dream careers and help companies find the
              perfect candidates.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Joblify was founded in 2018 with a simple but powerful vision: to transform the way people find
                  jobs and companies hire talent.
                </p>
                <p className="text-lg text-muted-foreground mb-4">
                  After experiencing the frustrations of traditional job searching firsthand, our founders Sarah Johnson
                  and Michael Chen set out to create a platform that would make the process more efficient, transparent,
                  and human-centered.
                </p>
                <p className="text-lg text-muted-foreground">
                  Today, Joblify helps thousands of job seekers find meaningful careers and enables companies of all
                  sizes to build their dream teams. We're proud of how far we've come, but we're just getting started.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&h=600&auto=format&fit=crop"
                  alt="Joblify team"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto">
              To create a world where everyone can find work they love and companies can build teams that thrive.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    className="h-8 w-8 text-primary"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center md:text-left">For Job Seekers</h3>
                <p className="text-muted-foreground">
                  We empower job seekers with the tools, resources, and connections they need to discover and secure
                  opportunities that align with their skills, values, and career goals.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    className="h-8 w-8 text-primary"
                  >
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center md:text-left">For Employers</h3>
                <p className="text-muted-foreground">
                  We help employers of all sizes find, attract, and hire the right talent efficiently. Our platform
                  streamlines the recruitment process and connects companies with qualified candidates who will
                  contribute to their success.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    className="h-8 w-8 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m7 10 3 3 7-7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center md:text-left">Our Commitment</h3>
                <p className="text-muted-foreground">
                  We're committed to creating a fair, inclusive, and transparent job marketplace. We believe that
                  everyone deserves access to opportunities and that diverse teams drive innovation and success.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
              We're a diverse team of passionate individuals dedicated to transforming the job search experience.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-card rounded-lg shadow-sm overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary mb-3">{member.role}</p>
                    <p className="text-muted-foreground">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
            <p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
              These core principles guide everything we do at Joblify.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">User-Centered</h3>
                <p className="text-muted-foreground">
                  We put our users first in everything we do, constantly seeking feedback and improving our platform to
                  meet their needs.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Transparency</h3>
                <p className="text-muted-foreground">
                  We believe in open, honest communication with our users, partners, and within our team.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  We're constantly exploring new ideas and technologies to improve the job search and hiring experience.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Diversity & Inclusion</h3>
                <p className="text-muted-foreground">
                  We celebrate diversity and are committed to creating an inclusive platform where everyone feels
                  welcome.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Quality</h3>
                <p className="text-muted-foreground">
                  We're dedicated to providing high-quality service and maintaining the highest standards in everything
                  we do.
                </p>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Impact</h3>
                <p className="text-muted-foreground">
                  We measure our success by the positive impact we have on the lives of job seekers and the growth of
                  businesses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Whether you're looking for your next career opportunity, hiring for your team, or interested in joining
              our company, we'd love to connect with you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/jobs">Find Jobs</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/post-job">Post a Job</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/careers">Careers at Joblify</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}