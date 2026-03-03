"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import joblifyLogo from "../assets/joblify-logo.jpeg"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-blue-200/50 shadow-blue' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                <img 
                  src={joblifyLogo} 
                  alt="Joblify Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight transition-all duration-500 ${
                isScrolled ? 'opacity-100' : 'opacity-90'
              }`}>
              Joblify
              </span>
            </Link>
            
            <nav className="ml-12 hidden lg:flex space-x-6">
              {[
                { to: "/jobs", label: "Find Jobs", icon: "🔍" },
                { to: "/companies", label: "Companies", icon: "🏢" },
                { to: "/resources", label: "Resources", icon: "📚" },
                { to: "/about", label: "About Us", icon: "ℹ️" }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-500 hover:bg-blue-500/10 hover:scale-105 ${
                    isScrolled ? 'text-foreground hover:text-blue-600' : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:rotate-12">
                    {item.icon}
                  </span>
                  <span className="font-semibold tracking-wide">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="outline" 
                asChild
                size="lg"
                className={`transition-all duration-500 hover:scale-105 hover:shadow-lg ${
                  isScrolled 
                    ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50' 
                    : 'border-white/30 text-white hover:bg-white/10 hover:border-white/50'
                }`}
              >
                <Link to="/login">Log In</Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-blue-500/25"
              >
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
            
            <div className="lg:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMenu} 
                aria-label="Toggle menu"
                className={`w-12 h-12 transition-all duration-500 hover:scale-110 hover:bg-primary/10 ${
                  isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-7 w-7 transition-all duration-500 ${isMenuOpen ? 'rotate-90 scale-110' : ''}`}
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        <div className={`lg:hidden transition-all duration-500 ease-in-out overflow-hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-8 border-t border-border/20">
            <nav className="flex flex-col space-y-6">
              {[
                { to: "/jobs", label: "Find Jobs", icon: "🔍" },
                { to: "/companies", label: "Companies", icon: "🏢" },
                { to: "/resources", label: "Resources", icon: "📚" },
                { to: "/about", label: "About Us", icon: "ℹ️" }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-500 hover:bg-primary/10 hover:text-primary hover:scale-105 ${
                    isScrolled ? 'text-foreground' : 'text-white/90'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-2xl transform transition-transform duration-500 hover:rotate-12">{item.icon}</span>
                  <span className="font-semibold text-lg">{item.label}</span>
                </Link>
              ))}
              
              <div className="flex flex-col space-y-4 pt-6 border-t border-border/20">
                <Button variant="outline" asChild size="lg" className="w-full">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button asChild size="lg" className="w-full btn-primary-gradient shadow-lg">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}