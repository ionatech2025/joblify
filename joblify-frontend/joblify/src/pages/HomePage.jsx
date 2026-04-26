import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { JobCard } from '../components/JobCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SearchBar } from '../components/SearchBar';

// Mock data for featured jobs
const featuredJobs = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$90,000 - $120,000',
    description:
      'We are looking for a skilled Frontend Developer to join our team and help build amazing user experiences...',
    requirements: [
      '3+ years of React experience',
      'Strong JavaScript skills',
      'Experience with responsive design',
    ],
    postedDate: '2023-05-15',
  },
  {
    id: '2',
    title: 'Backend Engineer',
    company: 'DataSystems',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100,000 - $130,000',
    description:
      'Join our backend team to build scalable APIs and services that power millions of users worldwide...',
    requirements: [
      'Experience with Node.js',
      'Database design skills',
      'Knowledge of cloud services',
    ],
    postedDate: '2023-05-10',
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'CreativeMinds',
    location: 'New York, NY',
    type: 'Contract',
    salary: '$70 - $90 per hour',
    description:
      'Design beautiful and intuitive user interfaces for our products that delight users and drive engagement...',
    requirements: [
      'Portfolio showcasing UI/UX work',
      'Proficiency in Figma',
      'Understanding of user research',
    ],
    postedDate: '2023-05-12',
  },
];

// Testimonials data
const testimonials = [
  {
    id: 1,
    quote:
      'Joblify helped me find my dream job in just two weeks. The platform is intuitive and the job recommendations were spot on!',
    name: 'Alex Johnson',
    title: 'Software Engineer',
    company: 'TechCorp',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
    rating: 5,
  },
  {
    id: 2,
    quote:
      "As a hiring manager, Joblify has transformed our recruitment process. We've found amazing talent quickly and efficiently.",
    name: 'Sarah Williams',
    title: 'HR Director',
    company: 'InnovateTech',
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    rating: 5,
  },
  {
    id: 3,
    quote:
      "The career resources and salary insights helped me negotiate a 15% higher offer. I couldn't be more grateful!",
    name: 'Michael Chen',
    title: 'Product Manager',
    company: 'DataSystems',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 5,
  },
];

// Stats data
const stats = [
  { label: 'Active Job Listings', value: '10,000+', icon: '💼' },
  { label: 'Companies Hiring', value: '2,500+', icon: '🏢' },
  { label: 'Successful Placements', value: '50,000+', icon: '🎯' },
  { label: 'Candidate Success Rate', value: '94%', icon: '⭐' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 text-white py-24 lg:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-pattern-blue-dots opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-400/30 rounded-full blur-2xl animate-float delay-500"></div>
            <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-float delay-700"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="animate-bounce-in">
                <div className="mb-6 inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-semibold">10,000+ Jobs Available Now</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-tight">
                  Find Your{' '}
                  <span className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent text-center animate-pulse">
                    Dream Job
                  </span>{' '}
                  Today
                </h1>
                <p className="text-xl md:text-2xl lg:text-3xl mb-10 max-w-4xl mx-auto opacity-95 leading-relaxed font-light">
                  Connect with top employers and discover opportunities that match your skills and
                  career goals. Join thousands of professionals who have found success with Joblify.
                </p>
              </div>

              <div className="animate-slide-up mb-12">
                <SearchBar />
              </div>

              <div className="flex flex-wrap justify-center gap-6 animate-fade-in">
                <Button
                  asChild
                  size="xl"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl"
                >
                  <Link to="/jobs">Browse All Jobs</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="xl"
                  className="bg-transparent border-2 border-white/60 text-white hover:bg-white/20 hover:border-white/80 text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl backdrop-blur-sm"
                >
                  <Link to="/post-job">Post a Job</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="container mx-auto px-4 mt-20 relative z-10">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-10 md:p-12 border border-white/30 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-4 group">
                    <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                      {stat.icon}
                    </div>
                    <p className="text-4xl md:text-5xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </p>
                    <p className="text-sm md:text-base opacity-90 font-semibold text-blue-100 group-hover:text-white transition-colors duration-300">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Featured Jobs Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-pattern-blue-waves opacity-5"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-6 py-2 mb-6 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-sm font-bold">FEATURED OPPORTUNITIES</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Featured Job Opportunities
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                Discover top positions from leading companies that are hiring right now. These
                opportunities are carefully curated for the best candidates like you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
              {featuredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                size="xl"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl"
              >
                <Link to="/jobs">View All Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-24 bg-white relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-6 py-2 mb-6 shadow-lg">
                <span className="text-sm font-bold">SUCCESS STORIES</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                What Our Users Say
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                Join thousands of professionals who have found success with Joblify. Here's what
                they have to say about their experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-3xl p-10 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 border border-gray-100 hover:border-blue-200 animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="mb-8">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-7 h-7 inline-block text-yellow-400 mr-1 hover:scale-110 transition-transform duration-300"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>

                  <blockquote className="text-xl mb-10 flex-1 italic leading-relaxed text-gray-700 font-medium">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-2xl mr-4 border-3 border-blue-200 shadow-lg"
                    />
                    <div>
                      <p className="font-bold text-xl text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-600 font-medium">
                        {testimonial.title}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced How It Works Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-pattern-grid opacity-5"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-6 py-2 mb-6 shadow-lg">
                <span className="text-sm font-bold">HOW IT WORKS</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                Get started with Joblify in three simple steps and find your dream job today.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Create Your Profile',
                  description:
                    'Sign up and build your professional profile to showcase your skills and experience.',
                  icon: '👤',
                },
                {
                  step: '2',
                  title: 'Discover Opportunities',
                  description:
                    'Browse through job listings or use our smart search to find the perfect match.',
                  icon: '🔍',
                },
                {
                  step: '3',
                  title: 'Apply with Ease',
                  description:
                    'Submit your application with just a few clicks and track your application status.',
                  icon: '📝',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-10 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 border border-gray-100 hover:border-blue-200 text-center animate-slide-up relative overflow-hidden group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div className="text-4xl font-black text-blue-600 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced For Employers Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-pattern-blue-waves opacity-5"></div>
          <div className="absolute top-20 right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="lg:w-1/2">
                <div className="mb-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-6 py-2 mb-6 shadow-lg">
                    <span className="text-sm font-bold">FOR EMPLOYERS</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                    For Employers
                  </h2>
                </div>
                <p className="text-xl mb-10 text-gray-700 leading-relaxed font-light">
                  Post job opportunities and find the perfect candidates for your company. Our
                  platform connects you with qualified professionals ready to contribute to your
                  success.
                </p>
                <ul className="space-y-6 mb-12">
                  {[
                    'Reach thousands of qualified candidates',
                    'Streamlined hiring process',
                    'Advanced candidate filtering',
                    'Analytics and insights',
                    'Dedicated support team',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center group">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-lg text-gray-800 font-medium group-hover:text-blue-600 transition-colors duration-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="xl"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl hover:shadow-3xl text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl"
                >
                  <Link to="/employer-signup">Get Started</Link>
                </Button>
              </div>

              <div className="lg:w-1/2">
                <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:scale-105">
                  <h3 className="text-3xl font-bold mb-8 text-gray-900">Post Your First Job</h3>
                  <p className="text-gray-600 mb-10 leading-relaxed text-lg font-light">
                    Create an employer account and post your first job listing for free.
                  </p>
                  <div className="space-y-8">
                    {[
                      {
                        icon: '🏢',
                        title: 'Create a company profile',
                        description: 'Showcase your brand and company culture',
                      },
                      {
                        icon: '📋',
                        title: 'Post detailed job listings',
                        description: 'Specify requirements and responsibilities',
                      },
                      {
                        icon: '👥',
                        title: 'Review applicants',
                        description: 'Evaluate candidates and schedule interviews',
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center group">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-6 flex-shrink-0 text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-gray-600 font-medium">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="w-full mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl text-lg px-8 py-4 transition-all duration-300 transform hover:scale-105 font-bold rounded-2xl"
                  >
                    <Link to="/post-job">Post a Job</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                  </span>
                  <span className="text-sm font-bold">LIMITED TIME OFFER</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8">
                Ready to Take the Next Step in Your Career?
              </h2>
              <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-95 leading-relaxed font-light">
                Join thousands of professionals who have found their{' '}
                <span className="text-yellow-300 font-bold">dream jobs</span> through Joblify. Start
                your journey today and unlock new opportunities.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button
                  asChild
                  size="xl"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl"
                >
                  <Link to="/signup">Create Your Free Account</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="xl"
                  className="bg-transparent border-2 border-white/60 text-white hover:bg-white/20 hover:border-white/80 text-xl px-12 py-6 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 font-bold rounded-2xl backdrop-blur-sm"
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
