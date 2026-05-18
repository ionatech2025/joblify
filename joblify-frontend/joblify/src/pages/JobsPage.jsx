import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { JobCard } from "../components/JobCard";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import { motion } from "framer-motion";

// Mock data (unchanged)
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
];

export default function JobsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="flex-1">
        {/* Premium Hero */}
        <section className="relative py-28 lg:py-36 bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:50px_50px] opacity-40" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-semibold tracking-tighter mb-6"
            >
              Find Your Next<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                Opportunity
              </span>
            </motion.h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Discover thousands of jobs from the best companies
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Premium Filters Sidebar */}
              <div className="lg:w-80 lg:sticky lg:top-6 lg:self-start">
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-2xl font-semibold mb-8">Filters</h2>

                  <div className="space-y-10">
                    <div>
                      <h3 className="font-semibold mb-4">Job Type</h3>
                      <div className="space-y-3">
                        {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
                          <div key={type} className="flex items-center gap-3">
                            <Checkbox id={type} />
                            <label htmlFor={type} className="text-zinc-300 cursor-pointer">{type}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Experience Level</h3>
                      <div className="space-y-3">
                        {["Entry Level", "Mid Level", "Senior Level"].map((level) => (
                          <div key={level} className="flex items-center gap-3">
                            <Checkbox id={level} />
                            <label htmlFor={level} className="text-zinc-300 cursor-pointer">{level}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Salary Range</h3>
                      <Slider defaultValue={[50000, 150000]} min={0} max={200000} step={5000} className="mb-4" />
                      <div className="flex justify-between text-sm text-zinc-400">
                        <span>$0</span>
                        <span>$200k+</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Location</h3>
                      <div className="space-y-3">
                        {["Remote", "Hybrid", "On-site"].map((loc) => (
                          <div key={loc} className="flex items-center gap-3">
                            <Checkbox id={loc} />
                            <label htmlFor={loc} className="text-zinc-300 cursor-pointer">{loc}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-10 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500">
                    Apply Filters
                  </Button>
                </div>
              </div>

              {/* Job Listings */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    {jobs.length} Opportunities
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">Sort by:</span>
                    <select className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2 text-sm">
                      <option>Most Relevant</option>
                      <option>Newest First</option>
                      <option>Highest Salary</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-8">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex justify-center">
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>Previous</Button>
                    <Button className="bg-blue-600">1</Button>
                    <Button variant="outline">2</Button>
                    <Button variant="outline">3</Button>
                    <Button variant="outline">Next</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}