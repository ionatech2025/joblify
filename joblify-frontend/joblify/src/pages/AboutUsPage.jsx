import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Add this dependency for premium animations

// Team members with better imagery and subtle enhancements
const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    bio: "Visionary leader with 15+ years in HR innovation. Passionate about building equitable opportunities.",
  },
  {
    name: "Michael Chen",
    role: "CTO & Co-Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    bio: "Former engineering leader at FAANG companies. Obsessed with crafting delightful, scalable experiences.",
  },
  {
    name: "Jessica Rodriguez",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1580489944761-09be1ec59862?q=80&w=800&auto=format&fit=crop",
    bio: "Product strategist and UX advocate. Turns complex problems into intuitive, human-centered solutions.",
  },
  {
    name: "David Kim",
    role: "Head of Marketing",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
    bio: "Growth marketer who believes authentic storytelling connects talent with opportunity.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-hidden">
      <Header />

      <main className="flex-1">
        {/* HERO - Premium & Emotional Impact */}
        <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(59,130,246,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium tracking-widest uppercase">Est. 2018 • San Francisco</span>
              </div>

              <h1 className="text-7xl md:text-[92px] leading-[1.05] font-semibold tracking-tighter mb-6">
                Careers that<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  matter
                </span>
              </h1>

              <p className="text-2xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-light tracking-tight mb-10">
                We’re redefining how talent and opportunity connect — with respect, clarity, and joy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-medium rounded-2xl bg-white text-zinc-950 hover:bg-white/90 transition-all active:scale-[0.985]">
                  <Link to="/jobs">Explore Opportunities</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-medium rounded-2xl border-white/30 hover:bg-white/5">
                  <Link to="/post-job">For Employers</Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Scroll Prompt */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs tracking-widest text-zinc-500"
          >
            SCROLL TO DISCOVER
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-500 to-transparent" />
          </motion.div>
        </section>

        {/* OUR STORY - Visual Storytelling */}
        <section className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="inline text-blue-400 font-mono tracking-[3px] text-sm">CHAPTER 01 — ORIGINS</div>
                <h2 className="text-6xl font-semibold tracking-tighter leading-none">
                  From frustration<br />to possibility
                </h2>
                
                <div className="space-y-6 text-lg text-zinc-400 max-w-lg">
                  <p>
                    In 2018, Sarah and Michael met at a coffee shop after both had exhausting job search experiences. 
                    They knew there had to be a better way.
                  </p>
                  <p>
                    Today, Joblify has helped over 240,000 professionals find work they love and empowered 3,800+ companies to build stronger teams.
                  </p>
                </div>

                <div className="flex items-center gap-8 pt-6">
                  <div>
                    <div className="text-5xl font-semibold text-white">240K+</div>
                    <div className="text-zinc-500">Lives impacted</div>
                  </div>
                  <div>
                    <div className="text-5xl font-semibold text-white">4.9/5</div>
                    <div className="text-zinc-500">Average satisfaction</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop"
                    alt="Joblify founding team in discussion"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative accent */}
                <div className="absolute -bottom-6 -right-6 bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-[220px] backdrop-blur-xl">
                  <p className="italic text-sm text-zinc-400">"We didn't just build another job board. We built a movement."</p>
                  <p className="text-xs mt-4 text-blue-400">— Sarah Johnson</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MISSION - Elevated Cards */}
        <section className="py-24 bg-zinc-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="uppercase tracking-[4px] text-blue-500 text-sm mb-3">CHAPTER 02 — PURPOSE</div>
              <h2 className="text-5xl font-semibold tracking-tighter">Work should feel meaningful</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "👤",
                  title: "For Job Seekers",
                  desc: "Tools that respect your time and celebrate your unique journey. Match with roles that align with your values and ambitions.",
                },
                {
                  icon: "🏢",
                  title: "For Employers",
                  desc: "Hire faster, smarter, and more fairly. Connect with candidates who are passionate about your mission.",
                },
                {
                  icon: "🌍",
                  title: "For Everyone",
                  desc: "A transparent, bias-aware marketplace that champions diversity and human potential.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-zinc-950 border border-white/5 hover:border-blue-500/30 rounded-3xl p-10 transition-all hover:-translate-y-2"
                >
                  <div className="text-6xl mb-8 opacity-80 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-3xl font-semibold mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM - Premium Grid */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <div className="uppercase tracking-widest text-sm text-zinc-500 mb-2">CHAPTER 03 — HUMANS</div>
                <h2 className="text-5xl font-semibold tracking-tighter">Meet the dreamers &amp; doers</h2>
              </div>
              <p className="text-zinc-400 max-w-xs hidden md:block">
                A small but mighty team united by curiosity, empathy, and relentless execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="relative aspect-[4/3.1] rounded-3xl overflow-hidden mb-6 shadow-xl">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="font-semibold text-2xl">{member.name}</div>
                      <div className="text-blue-400 text-sm tracking-wider">{member.role}</div>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[15px] leading-relaxed line-clamp-3">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES - Modern Horizontal Scroll on Mobile */}
        <section className="py-24 bg-zinc-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-semibold tracking-tighter mb-3">What drives us</h2>
              <p className="text-zinc-400 text-xl">Principles we live by every day</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Radical Empathy", desc: "We design for real humans, not resumes." },
                { title: "Obsessive Clarity", desc: "No corporate jargon. Just honest communication." },
                { title: "Courageous Innovation", desc: "We ship bold ideas and iterate fearlessly." },
                { title: "Deep Inclusion", desc: "Diversity isn’t a checkbox — it’s our foundation." },
                { title: "Sustainable Excellence", desc: "Quality compounds. We never cut corners." },
                { title: "Measurable Impact", desc: "If it doesn’t improve lives, it doesn’t ship." },
              ].map((value, i) => (
                <div
                  key={i}
                  className="bg-zinc-950 border border-white/5 p-8 rounded-3xl group hover:border-white/20 transition-colors"
                >
                  <div className="h-1.5 w-12 bg-gradient-to-r from-blue-400 to-violet-400 rounded mb-8 group-hover:w-16 transition-all" />
                  <h3 className="text-2xl font-semibold mb-3 tracking-tight">{value.title}</h3>
                  <p className="text-zinc-400">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA - High Conversion */}
        <section className="py-32 border-t border-white/10">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-6xl font-semibold tracking-tighter mb-6">
                Ready to write the next chapter?
              </h2>
              <p className="text-xl text-zinc-400 mb-12">
                Whether you're searching for purpose or building a world-class team — we're here for it.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="h-16 px-12 text-lg rounded-2xl bg-white hover:bg-zinc-100 text-black font-medium">
                  <Link to="/jobs">Find Your Next Role</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-12 text-lg rounded-2xl border-white/30 hover:bg-white/5">
                  <Link to="/post-job">Hire Talent</Link>
                </Button>
              </div>

              <p className="text-xs text-zinc-500 mt-8">Join 240,000+ professionals already on the journey</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}