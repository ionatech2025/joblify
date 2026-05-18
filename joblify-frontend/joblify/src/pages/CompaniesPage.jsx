"use client"

import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { motion } from "framer-motion";

// Your original company data
const companies = [
  {
    id: "1",
    name: "TechCorp",
    logo: "https://placehold.co/120x120/4F46E5/FFFFFF?text=TC",
    industry: "Technology",
    location: "San Francisco, CA",
    description: "A leading technology company specializing in innovative software solutions for businesses of all sizes.",
    employees: "500-1000",
    founded: "2010",
    openPositions: 12,
    benefits: ["Health Insurance", "Remote Work", "401(k) Matching", "Professional Development"],
  },
  {
    id: "2",
    name: "DataSystems",
    logo: "https://placehold.co/120x120/22C55E/FFFFFF?text=DS",
    industry: "Data Analytics",
    location: "Remote",
    description: "Specializing in big data solutions and analytics platforms that help businesses make data-driven decisions.",
    employees: "100-500",
    founded: "2015",
    openPositions: 8,
    benefits: ["Flexible Hours", "Health Benefits", "Stock Options", "Unlimited PTO"],
  },
  {
    id: "3",
    name: "CreativeMinds",
    logo: "https://placehold.co/120x120/EC4899/FFFFFF?text=CM",
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
    logo: "https://placehold.co/120x120/3B82F6/FFFFFF?text=CT",
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
    logo: "https://placehold.co/120x120/F59E0B/FFFFFF?text=AP",
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
    logo: "https://placehold.co/120x120/EF4444/FFFFFF?text=IT",
    industry: "Product Development",
    location: "Seattle, WA",
    description: "An innovation-focused company building next-generation products and services.",
    employees: "500-1000",
    founded: "2011",
    openPositions: 10,
    benefits: ["Competitive Salary", "Stock Options", "Health Benefits", "Work-Life Balance"],
  },
];

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === "" || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(companies.map((company) => company.industry))];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="flex-1">
        {/* Premium Hero */}
        <section className="relative py-28 lg:py-36 bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:50px_50px] opacity-30" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-semibold tracking-tighter mb-6"
            >
              Discover companies<br />that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">inspire</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              Explore top companies actively hiring talented professionals like you.
            </motion.p>
          </div>
        </section>

        {/* Sticky Search & Filter */}
        <section className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-lg border-b border-white/10 py-6">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search companies by name or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 bg-zinc-950 border-white/10 h-14 text-lg placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="h-14 bg-zinc-950 border border-white/10 rounded-2xl px-5 text-white focus:border-blue-500"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>

              <Button size="lg" className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500">
                Search
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">
                {filteredCompanies.length} Companies Found
              </h2>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">Sort by:</span>
                <select className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2 text-sm">
                  <option>Most Relevant</option>
                  <option>Most Open Positions</option>
                  <option>Recently Added</option>
                  <option>Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Premium Company Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group bg-zinc-900 border border-white/10 hover:border-blue-500/30 rounded-3xl overflow-hidden flex flex-col transition-all duration-500"
                >
                  <div className="p-8 flex-1">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/10 group-hover:ring-blue-500/30 transition-all">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-14 h-14 object-contain rounded-xl"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold group-hover:text-blue-400 transition-colors">
                          <Link to={`/companies/${company.id}`}>{company.name}</Link>
                        </h3>
                        <p className="text-blue-400 text-sm font-medium">{company.industry}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 text-sm">
                      <div className="flex items-center gap-3 text-zinc-400">
                        📍 <span>{company.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400">
                        👥 <span>{company.employees} employees</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400">
                        🏛️ <span>Founded {company.founded}</span>
                      </div>
                    </div>

                    <p className="text-zinc-400 line-clamp-3 mb-8 leading-relaxed">
                      {company.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {company.benefits.slice(0, 3).map((benefit, i) => (
                        <Badge key={i} variant="outline" className="bg-zinc-950 border-white/10 text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-8 mt-auto bg-zinc-950/50">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                        {company.openPositions} open roles
                      </Badge>
                      <Button asChild className="rounded-2xl">
                        <Link to={`/companies/${company.id}`}>View Company</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCompanies.length === 0 && (
              <div className="text-center py-20">
                <p className="text-6xl mb-6">😕</p>
                <h3 className="text-2xl font-medium mb-3">No companies found</h3>
                <p className="text-zinc-500 mb-8">Try adjusting your search terms or filters</p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setIndustryFilter("");
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}