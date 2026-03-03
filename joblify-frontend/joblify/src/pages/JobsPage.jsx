import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { JobCard } from "../components/JobCard"
import { SearchBar } from "../components/SearchBar"
import { Button } from "../components/ui/button"
import { Checkbox } from "../components/ui/checkbox"
import { Slider } from "../components/ui/slider"

// Mock data for jobs
const jobs = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$90,000 - $120,000",
    description: "We are looking for a skilled Frontend Developer to join our team...",
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
    description: "Join our backend team to build scalable APIs and services...",
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
    description: "Design beautiful and intuitive user interfaces for our products...",
    requirements: ["Portfolio showcasing UI/UX work", "Proficiency in Figma", "Understanding of user research"],
    postedDate: "2023-05-12",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudTech",
    location: "Chicago, IL",
    type: "Full-time",
    salary: "$110,000 - $140,000",
    description: "Implement and manage CI/CD pipelines and cloud infrastructure...",
    requirements: ["Experience with AWS/Azure", "Knowledge of Docker and Kubernetes", "Scripting skills"],
    postedDate: "2023-05-08",
  },
  {
    id: "5",
    title: "Data Scientist",
    company: "AnalyticsPro",
    location: "Boston, MA",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    description: "Analyze complex data sets to drive business decisions...",
    requirements: ["Strong background in statistics", "Experience with Python and R", "Machine learning knowledge"],
    postedDate: "2023-05-05",
  },
  {
    id: "6",
    title: "Product Manager",
    company: "InnovateTech",
    location: "Seattle, WA",
    type: "Full-time",
    salary: "$115,000 - $145,000",
    description: "Lead product development from conception to launch...",
    requirements: ["3+ years in product management", "Strong communication skills", "Technical background"],
    postedDate: "2023-05-03",
  },
]

export default function JobsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-yellow-200 text-center">Find Your Perfect Job</h1>
            <SearchBar />
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className="lg:w-1/4 space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-4">Filters</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Job Type</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="fulltime" />
                          <label htmlFor="fulltime" className="text-sm">
                            Full-time
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="parttime" />
                          <label htmlFor="parttime" className="text-sm">
                            Part-time
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="contract" />
                          <label htmlFor="contract" className="text-sm">
                            Contract
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="internship" />
                          <label htmlFor="internship" className="text-sm">
                            Internship
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Experience Level</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="entry" />
                          <label htmlFor="entry" className="text-sm">
                            Entry Level
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mid" />
                          <label htmlFor="mid" className="text-sm">
                            Mid Level
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="senior" />
                          <label htmlFor="senior" className="text-sm">
                            Senior Level
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Salary Range</h3>
                      <div className="space-y-4">
                        <Slider defaultValue={[50000, 150000]} min={0} max={200000} step={5000} />
                        <div className="flex justify-between">
                          <span className="text-sm">$0</span>
                          <span className="text-sm">$200k+</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Location</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remote" />
                          <label htmlFor="remote" className="text-sm">
                            Remote
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="hybrid" />
                          <label htmlFor="hybrid" className="text-sm">
                            Hybrid
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="onsite" />
                          <label htmlFor="onsite" className="text-sm">
                            On-site
                          </label>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full">Apply Filters</Button>
                  </div>
                </div>
              </div>

              {/* Job Listings */}
              <div className="lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Showing {jobs.length} jobs</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <select className="text-sm border rounded p-1">
                      <option>Most Relevant</option>
                      <option>Newest</option>
                      <option>Highest Salary</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

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
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}