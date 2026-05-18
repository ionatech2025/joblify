import { Link } from "react-router-dom";
import joblifyLogo from "../assets/joblify-logo.jpeg"; // Kept intact for build pipeline bindings

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#090D16] py-16 border-t border-slate-900 relative overflow-hidden">
      {/* Subtle bottom decorative light pool */}
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* ================= MAIN LINKS ARCHITECTURE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Vector Block */}
          <div className="lg:col-span-1 space-y-6">
            <Link to="/" className="flex items-center space-x-3 group w-max">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <span className="text-sm font-black text-white tracking-tighter">J</span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Joblify
              </span>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed font-light">
              Connecting premium structural talent profiles with top employers across the global ecosystem matrix. Your vector starts here.
            </p>
            
            {/* Social Asset Hub */}
            <div className="flex space-x-3">
              {[
                {
                  name: "LinkedIn",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "Twitter",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "Instagram",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "Facebook",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                  href: "#"
                }
              ].map((social) => (
                <Link
                  key={social.name}
                  to={social.href}
                  className="w-9 h-9 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 transform hover:-translate-y-0.5"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Column Group 1: Candidates */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-6 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2.5"></span>
              For Job Seekers
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: "Browse Jobs", href: "/jobs" },
                { label: "Browse Companies", href: "/companies" },
                { label: "Salary Guide", href: "/salary-guide" },
                { label: "Career Advice", href: "/career-advice" },
                { label: "Resume Builder", href: "/resume-builder" }
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    to={item.href} 
                    className="text-sm text-slate-400 hover:text-white transition-all duration-200 transform hover:translate-x-1.5 inline-block font-light"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column Group 2: Employers */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-6 flex items-center">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></span>
              For Employers
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: "Post a Job", href: "/post-job" },
                { label: "Pricing Models", href: "/pricing" },
                { label: "Employer Insights", href: "/employer-resources" },
                { label: "Talent Solutions", href: "/talent-solutions" },
                { label: "Enterprise Console", href: "/employer-login" }
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    to={item.href} 
                    className="text-sm text-slate-400 hover:text-white transition-all duration-200 transform hover:translate-x-1.5 inline-block font-light"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column Group 3: Company */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-6 flex items-center">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
              Company
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: "About Our Mission", href: "/about" },
                { label: "Contact Relations", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Platform Status", href: "/faq" }
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    to={item.href} 
                    className="text-sm text-slate-400 hover:text-white transition-all duration-200 transform hover:translate-x-1.5 inline-block font-light"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================= COMPLIANCE & META MATRIX ================= */}
        <div className="pt-8 border-t border-slate-900/80">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center md:text-left font-light">
              &copy; {currentYear} Joblify Inc. All operations secured under global data encryption frameworks.
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-500 font-light">
              <span className="flex items-center gap-1">
                Engineered with <span className="text-rose-500/80">✦</span> for global builders
              </span>
              <span>•</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded-md text-slate-400 border border-slate-800">
                v2.4.0
              </span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}