'use client';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import joblifyLogo from '../assets/joblify-logo.jpeg';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-blue-200/50 shadow-lg shadow-blue-500/10'
          : 'bg-white/90 backdrop-blur-md border-b border-blue-100/50 shadow-md shadow-blue-500/5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">J</span>
                </div>
              </div>
              <span
                className={`text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight transition-all duration-500 ${
                  isScrolled ? 'opacity-100' : 'opacity-95'
                }`}
              >
                Joblify
              </span>
              <div className="hidden md:flex items-center space-x-1">
                <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                  NEW
                </span>
                <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                  HOT
                </span>
              </div>
            </Link>

            <nav className="ml-12 hidden lg:flex space-x-2">
              {[
                { to: '/jobs', label: 'Find Jobs', icon: '�', badge: '2.5k+' },
                { to: '/companies', label: 'Companies', icon: '🏢', badge: '500+' },
                { to: '/resources', label: 'Resources', icon: '📚', badge: null },
                { to: '/about', label: 'About Us', icon: 'ℹ️', badge: null },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-500 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/10 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 ${
                    isScrolled
                      ? 'text-foreground hover:text-blue-600'
                      : 'text-foreground hover:text-blue-600'
                  }`}
                >
                  <div className="relative">
                    <span className="text-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                      {item.icon}
                    </span>
                    {item.badge && (
                      <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold tracking-wide">{item.label}</span>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="outline"
                asChild
                size="lg"
                className={`transition-all duration-500 hover:scale-105 hover:shadow-lg font-semibold ${
                  isScrolled
                    ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                    : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Link to="/login">Log In</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-105 font-semibold relative overflow-hidden group"
              >
                <Link to="/signup">
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </Button>
            </div>

            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                aria-label="Toggle menu"
                className={`w-12 h-12 transition-all duration-500 hover:scale-110 hover:bg-blue-500/10 rounded-xl ${
                  isScrolled
                    ? 'text-foreground hover:text-blue-600'
                    : 'text-foreground hover:text-blue-600'
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
        <div
          className={`lg:hidden transition-all duration-500 ease-in-out overflow-hidden ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-8 border-t border-blue-200/50 bg-white/95 backdrop-blur-xl">
            <nav className="flex flex-col space-y-4">
              {[
                { to: '/jobs', label: 'Find Jobs', icon: '�', badge: '2.5k+' },
                { to: '/companies', label: 'Companies', icon: '🏢', badge: '500+' },
                { to: '/resources', label: 'Resources', icon: '📚', badge: null },
                { to: '/about', label: 'About Us', icon: 'ℹ️', badge: null },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-500 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/10 hover:text-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 ${
                    isScrolled ? 'text-foreground' : 'text-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="relative">
                    <span className="text-2xl transform transition-transform duration-500 hover:rotate-12">
                      {item.icon}
                    </span>
                    {item.badge && (
                      <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-lg">{item.label}</span>
                </Link>
              ))}

              <div className="flex flex-col space-y-3 pt-6 border-t border-blue-200/50">
                <Button variant="outline" asChild size="lg" className="w-full font-semibold">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl font-semibold"
                >
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
  );
}
