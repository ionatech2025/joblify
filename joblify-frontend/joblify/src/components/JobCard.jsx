import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

export function JobCard({ job }) {
  const postedDate = new Date(job.postedDate);
  const today = new Date();
  const diffDays = Math.ceil(
    Math.abs(today.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getCompanyInitials = (companyName) => {
    return companyName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.4 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-zinc-900 border border-white/10 hover:border-blue-500/30 rounded-3xl overflow-hidden h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-500"
    >
      {/* Top Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <div className="p-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            {/* Company Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-400 ring-1 ring-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
              {getCompanyInitials(job.company)}
            </div>

            <div>
              <h3 className="text-2xl font-semibold leading-tight tracking-tight text-white group-hover:text-blue-400 transition-colors">
                <Link to={`/jobs/${job.id}`} className="hover:underline decoration-blue-500/40 underline-offset-4">
                  {job.title}
                </Link>
              </h3>
              <p className="text-lg font-medium text-zinc-400 mt-2">{job.company}</p>
            </div>
          </div>

          {/* Job Type Badge */}
          <Badge
            className={`px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${
              job.type === "Full-time"
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600"
            }`}
          >
            {job.type}
          </Badge>
        </div>

        {/* Meta Information */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 text-zinc-400">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-lg">
              📍
            </div>
            <span className="font-medium">{job.location}</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-lg">
              💰
            </div>
            <span className="font-semibold text-lg text-white">{job.salary}</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-lg">
              🕒
            </div>
            <span className="font-medium">
              Posted {diffDays} {diffDays === 1 ? "day" : "days"} ago
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-zinc-400 line-clamp-3 leading-relaxed mb-8 flex-1">
          {job.description}
        </p>

        {/* Requirements */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {job.requirements.slice(0, 4).map((req, index) => (
              <span
                key={index}
                className="inline-block px-4 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-colors border border-white/5 hover:border-blue-500/30"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 4 && (
              <span className="inline-block px-4 py-1.5 text-xs font-medium text-zinc-500">
                +{job.requirements.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-auto pt-6 border-t border-white/10">
          <Button
            asChild
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-white/20 hover:bg-white/5 hover:border-white/30 font-semibold transition-all"
          >
            <Link to={`/jobs/${job.id}`}>View Details</Link>
          </Button>

          <Button
            asChild
            className="flex-1 h-12 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.985]"
          >
            <Link to={`/jobs/${job.id}/apply`}>Apply Now</Link>
          </Button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-blue-500/10 group-hover:ring-blue-500/30 pointer-events-none transition-all duration-500" />
    </motion.div>
  );
}