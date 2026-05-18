"use client"

import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { motion } from "framer-motion";

// Your existing resources data (unchanged)
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
    excerpt: "Learn the essential elements of a standout resume and how to highlight your skills and experience effectively.",
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
    excerpt: "Prepare for your next interview with these common questions and expert tips on how to craft compelling answers.",
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
    excerpt: "Learn effective strategies for negotiating your salary and benefits package to ensure you're compensated fairly.",
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
    excerpt: "Considering a career change? Follow this comprehensive guide to make a successful transition to a new field.",
    tags: ["Career Change", "Professional Development", "Job Search"],
  },
];

const categories = ["All", ...new Set(resources.map((resource) => resource.category))];

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="flex-1">
        {/* Premium Hero */}
        <section className="relative py-28 lg:py-36 bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:50px_50px] opacity-40" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter mb-6">
              Career Resources &amp; Guides
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Expert advice to help you navigate your job search and advance your career
            </p>
          </div>
        </section>

        {/* Search & Category Filter */}
        <section className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-lg border-b border-white/10 py-6">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search for resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-zinc-950 border-white/10 h-14 text-lg focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap rounded-2xl px-6 h-14 transition-all ${
                      activeCategory === category 
                        ? "bg-blue-600 hover:bg-blue-500" 
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">
                {filteredResources.length} Resources Found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group bg-zinc-900 border border-white/10 hover:border-blue-500/30 rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-500"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={resource.image}
                      alt={resource.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black/70 backdrop-blur-md text-white border-none">
                        {resource.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 text-xs bg-black/70 backdrop-blur-md px-3 py-1 rounded-full">
                      {resource.readTime}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-semibold leading-tight mb-4 group-hover:text-blue-400 transition-colors line-clamp-3">
                      <Link to={`/resources/${resource.id}`}>{resource.title}</Link>
                    </h3>

                    <p className="text-zinc-400 line-clamp-3 mb-8 flex-1">
                      {resource.excerpt}
                    </p>

                    {/* Author & Date */}
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium ring-1 ring-white/10">
                          {resource.author.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{resource.author}</p>
                          <p className="text-xs text-zinc-500">{formatDate(resource.date)}</p>
                        </div>
                      </div>

                      <Button asChild variant="outline" className="rounded-2xl border-white/20 hover:bg-white/5">
                        <Link to={`/resources/${resource.id}`}>Read More</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredResources.length === 0 && (
              <div className="text-center py-20">
                <p className="text-6xl mb-6">📖</p>
                <h3 className="text-2xl font-medium mb-3">No resources found</h3>
                <p className="text-zinc-500 mb-8">Try adjusting your search or category filter</p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Newsletter Section */}
            <div className="mt-20 bg-zinc-900 border border-white/10 rounded-3xl p-12 text-center">
              <h3 className="text-3xl font-semibold mb-4">Never miss a career tip</h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-8">
                Subscribe to our newsletter and get the latest guides, tips, and insights delivered weekly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-zinc-950 border-white/10 h-14 rounded-2xl" 
                />
                <Button size="lg" className="rounded-2xl h-14 px-10">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}