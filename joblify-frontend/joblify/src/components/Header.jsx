'use client';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import joblifyLogo from '../assets/joblify-logo.jpeg'; // Maintained for internal asset bindings

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Identity Unit */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="text-lg font-black text-white tracking-tighter">J</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Joblify
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-widest uppercase -mt-0.5 opacity-80">
                Talent Matrix
              </span>
            </div>
          </Link>

          {/* Centralized Navigation Arrays (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { to: '/jobs', label: 'Find Jobs', icon: '🔍', badge: '2.5k+' },
              { to: '/companies', label: 'Companies', icon: '🏢', badge: '500+' },
              { to: '/resources', label: 'Resources', icon: '📚', badge: null },
              { to: '/about', label: 'About Us', icon: 'ℹ️', badge: null },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl transition-all duration-200 hover:bg-slate-900/60"
              >
                <span className="text-base transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-400 rounded-md">
                    {item.badge}
                  </span>
                )}
                
                {/* Micro-Interaction Animated Underline */}
                <div className="absolute inset-x-4 bottom-1 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* User Auth Action Cluster (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Button
              asChild
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Link to="/signup">Register Account</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="w-11 h-11 transition-all duration-200 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-transparent hover:border-slate-800"
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
                className={`h-5 w-5 transition-transform duration-300 ${isMenuOpen ? 'rotate-90 text-white' : ''}`}
              >
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </Button>
          </div>

        </div>
      </div>

      {/* Advanced Mobile Menu Dropdown Panel */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden bg-[#0B0F19]/95 backdrop-blur-2xl border-b border-slate-800/80 ${
          isMenuOpen ? 'max-h-[450px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-6 py-6 space-y-6">
          <nav className="flex flex-col space-y-1">
            {[
              { to: '/jobs', label: 'Find Jobs', icon: '🔍', badge: '2.5k+' },
              { to: '/companies', label: 'Companies', icon: '🏢', badge: '500+' },
              { to: '/resources', label: 'Resources', icon: '📚', badge: null },
              { to: '/about', label: 'About Us', icon: 'ℹ️', badge: null },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User Auth Actions (Mobile) */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/60">
            <Button variant="outline" asChild className="w-full bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white py-5 rounded-xl">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-xl shadow-lg shadow-indigo-600/20">
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                Register Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}