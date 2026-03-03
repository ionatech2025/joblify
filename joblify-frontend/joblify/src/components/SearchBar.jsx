"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

export function SearchBar() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState("")
  const [location, setLocation] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (keyword.trim() || location.trim()) {
      navigate(`/jobs?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className={`relative p-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border transition-all duration-500 ${
        isFocused ? 'border-blue-500/50 shadow-blue-500/20' : 'border-white/20'
      }`}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Job Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-blue-600 transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Job title, keywords, or company"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-12 h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none text-lg font-medium"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            )}
          </div>

          {/* Location Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-blue-600 transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="City, state, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-12 h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none text-lg font-medium"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Button */}
          <Button 
            type="submit" 
            size="lg" 
            className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Search Jobs
          </Button>
        </div>

        {/* Popular Searches */}
        <div className="mt-4 pt-4 border-t border-blue-200/20">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Popular:</span>
            {["Software Engineer", "Remote", "React Developer", "UX Designer", "Product Manager"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setKeyword(term)}
                className="px-3 py-1 rounded-full bg-blue-100/50 hover:bg-blue-200/50 hover:text-blue-700 transition-all duration-200 text-xs font-medium"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}