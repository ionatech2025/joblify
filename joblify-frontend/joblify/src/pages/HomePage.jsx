import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { JobCard } from '../components/JobCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SearchBar } from '../components/SearchBar';

// Mock data remains structurally complete to preserve framework bindings
const featuredJobs = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$90,000 - $120,000',
    description: 'We are looking for a skilled Frontend Developer to join our team and help build amazing user experiences...',
    requirements: ['3+ years of React experience', 'Strong JavaScript skills', 'Experience with responsive design'],
    postedDate: '2023-05-15',
  },
  {
    id: '2',
    title: 'Backend Engineer',
    company: 'DataSystems',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100,000 - $130,000',
    description: 'Join our backend team to build scalable APIs and services that power millions of users worldwide...',
    requirements: ['Experience with Node.js', 'Database design skills', 'Knowledge of cloud services'],
    postedDate: '2023-05-10',
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'CreativeMinds',
    location: 'New York, NY',
    type: 'Contract',
    salary: '$70 - $90 per hour',
    description: 'Design beautiful and intuitive user interfaces for our products that delight users and drive engagement...',
    requirements: ['Portfolio showcasing UI/UX work', 'Proficiency in Figma', 'Understanding of user research'],
    postedDate: '2023-05-12',
  },
];

const testimonials = [
  {
    id: 1,
    quote: 'Joblify helped me find my dream job in just two weeks. The platform is intuitive and the job recommendations were spot on!',
    name: 'Alex Johnson',
    title: 'Software Engineer',
    company: 'TechCorp',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
    rating: 5,
  },
  {
    id: 2,
    quote: "As a hiring manager, Joblify has transformed our recruitment process. We've found amazing talent quickly and efficiently.",
    name: 'Sarah Williams',
    title: 'HR Director',
    company: 'InnovateTech',
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    rating: 5,
  },
  {
    id: 3,
    quote: "The career resources and salary insights helped me negotiate a 15% higher offer. I couldn't be more grateful!",
    name: 'Michael Chen',
    title: 'Product Manager',
    company: 'DataSystems',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 5,
  },
];

const stats = [
  { label: 'Active Job Listings', value: '10,000+', icon: '💼' },
  { label: 'Companies Hiring', value: '2,500+', icon: '🏢' },
  { label: 'Successful Placements', value: '50,000+', icon: '🎯' },
  { label: 'Candidate Success Rate', value: '94%', icon: '⭐' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-slate-100 antialiased font-sans overflow-x-hidden">
      <Header />
      <main className="flex-1">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden border-b border-slate-800/60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-[#0B0F19]">
          
          {/* Advanced Geometric Illumination Fields */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse duration-[8s]" />
            <div className="absolute bottom-[10%] right-[-5%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[160px] animate-pulse duration-[12s]" />
            <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
            {/* Fine Tech Grid Overlay overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              
              {/* Premium Pill Badge */}
              <div className="inline-flex items-center space-x-3 bg-slate-900/80 backdrop-blur-xl rounded-full p-1.5 pr-5 border border-slate-800 shadow-[0_8px_32px_rgb(0,0,0,0.4)] mb-8 animate-fade-in">
                <span className="flex h-2.5 w-2.5 relative ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                  Live Global Matrix: <span className="text-cyan-400 font-bold">10,000+ Jobs Active</span>
                </span>
              </div>

              {/* High-Velocity Typographic Stack */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 tracking-tight text-white leading-[1.05]">
                Find Your{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
                  Dream Job
                </span>{' '}
                Today
              </h1>

              <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto text-slate-400 font-normal leading-relaxed">
                Connect with top employers and discover opportunities that match your skills and
                career goals. Join thousands of professionals who have found success with Joblify.
              </p>

              {/* Integrated Search Console Layer */}
              <div className="mb-14 p-2 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-3xl mx-auto transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_20px_50px_rgba(79,70,229,0.15)]">
                <SearchBar />
              </div>

              {/* Twin CTA Actions */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.5)] text-base font-bold px-10 py-6 transition-all duration-300 rounded-xl transform hover:-translate-y-0.5"
                >
                  <Link to="/jobs">Browse All Jobs</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white text-base font-bold px-10 py-6 transition-all duration-300 rounded-xl backdrop-blur-md border transform hover:-translate-y-0.5"
                >
                  <Link to="/post-job">Post a Job</Link>
                </Button>
              </div>

            </div>
          </div>

          {/* ================= TRUST PERFORMANCE GRID ================= */}
          <div className="container mx-auto px-6 mt-24 relative z-10">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-slate-800/80 shadow-[0_15px_35px_rgba(0,0,0,0.3)] max-w-5xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divider-y lg:divider-y-0 lg:divider-x divider-slate-800">
                {stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-center text-center group transition-all duration-300">
                    <div className="text-3xl mb-3 bg-slate-800/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700/30 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-300">
                      {stat.icon}
                    </div>
                    <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent group-hover:text-cyan-400 transition-colors duration-300">
                      {stat.value}
                    </span>
                    <span className="text-xs md:text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURED OPPORTUNITIES SECTION ================= */}
        <section className="py-24 bg-[#090D16] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full px-4 py-1.5 mb-4">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold tracking-widest uppercase">Curated Placements</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                Featured Job Opportunities
              </h2>
              <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Discover top positions from leading companies hiring right now. These opportunities are carefully curated for elite professionals like you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {featuredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* JobCard component inherits wrapper behaviors naturally */}
                  <JobCard job={job} />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 px-8 py-5 text-sm font-semibold tracking-wide rounded-xl transition-all duration-200 shadow-md"
              >
                <Link to="/jobs">View All Live Openings</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS SECTION ================= */}
        <section className="py-24 bg-[#0B0F19] border-t border-b border-slate-900 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-bold tracking-widest uppercase">Verified Authority</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                What Our Users Say
              </h2>
              <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who have found success with Joblify. Hear directly from our global network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 hover:bg-slate-900/80"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div>
                    <div className="flex space-x-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-amber-400"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <blockquote className="text-slate-300 text-base leading-relaxed mb-8 italic font-light">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>

                  <div className="flex items-center pt-4 border-t border-slate-800/60">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-11 h-11 rounded-full object-cover mr-3.5 border-2 border-slate-800"
                    />
                    <div>
                      <p className="font-semibold text-sm text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {testimonial.title} @ <span className="text-slate-400">{testimonial.company}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= WORKFLOW ENGINE SECTION ================= */}
        <section className="py-24 bg-[#090D16] relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-bold tracking-widest uppercase">System Framework</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                How It Works
              </h2>
              <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Get started with Joblify in three conversion-optimized actions designed to accelerate placement velocity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  description: 'Sign up and build your unified ecosystem profile to demonstrate platform competency and target skills.',
                  icon: '👤',
                },
                {
                  step: '02',
                  title: 'Discover Opportunities',
                  description: 'Query our optimized real-time listings or utilize neural indexing engines to isolate optimal matches.',
                  icon: '🔍',
                },
                {
                  step: '03',
                  title: 'Apply with Ease',
                  description: 'Dispatch verified application packets safely to tracking systems with unified processing controls.',
                  icon: '📝',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 text-7xl font-black text-slate-800/20 tracking-tight pr-4 pt-2 select-none group-hover:text-indigo-500/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl mb-6 shadow-sm border border-slate-700/30 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= EMPLOYER ENGAGEMENT ENGINE ================= */}
        <section className="py-24 bg-[#0B0F19] border-t border-slate-900 relative overflow-hidden">
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[130px]" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
              
              <div className="lg:w-1/2">
                <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-xs font-bold tracking-widest uppercase">Enterprise Scale</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                  For Employers
                </h2>
                <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed font-light">
                  Post job opportunities and identify pristine talent variants tailored directly to architectural needs. Our telemetry pairs deployment speed with precision.
                </p>
                
                <ul className="space-y-4 mb-10">
                  {[
                    'Reach thousands of qualified candidates',
                    'Streamlined hiring process',
                    'Advanced candidate filtering',
                    'Analytics and insights',
                    'Dedicated support team',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg text-sm font-bold px-8 py-5 rounded-xl transition-all duration-200"
                >
                  <Link to="/employer-signup">Deploy Employer Console</Link>
                </Button>
              </div>

              <div className="lg:w-1/2 w-full">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 md:p-10 shadow-2xl relative">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500/10 to-transparent w-full h-full rounded-2xl pointer-events-none" />
                  <h3 className="text-xl font-bold text-white mb-2">Post Your First Job</h3>
                  <p className="text-sm text-slate-400 mb-8 font-light">Create an employer account and seed candidate acquisition frameworks instantly.</p>
                  
                  <div className="space-y-6">
                    {[
                      { icon: '🏢', title: 'Create a company profile', description: 'Showcase your brand and company culture' },
                      { icon: '📋', title: 'Post detailed job listings', description: 'Specify architectural requirements and milestones' },
                      { icon: '👥', title: 'Review applicants', description: 'Evaluate candidates and configure secure scheduling pipeline modules' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start group">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-lg mr-4 flex-shrink-0 group-hover:bg-slate-700/80 transition-colors">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-white mb-0.5">{item.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-5 rounded-xl transition-all duration-200"
                  >
                    <Link to="/post-job">Post a Job</Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= FINAL CTA ACQUISITION OVERLAY ================= */}
        <section className="py-24 relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-950 via-[#0B0F19] to-[#0B0F19] border-t border-slate-900">
          <div className="absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(circle_at_center,white,transparent_80%)]" />
          
          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              
              <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-bold tracking-widest uppercase">Immediate Access</span>
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Ready to Take the Next Step in Your Career?
              </h2>
              
              <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed font-light">
                Join thousands of elite engineers and product experts mapping vectors to their <span className="text-cyan-400 font-medium">dream roles</span>. Setup takes moments.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold px-8 py-5 rounded-xl transition-all duration-200 shadow-xl"
                >
                  <Link to="/signup">Create Your Free Account</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-bold px-8 py-5 rounded-xl backdrop-blur-md"
                >
                  <Link to="/jobs">Browse Jobs</Link>
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