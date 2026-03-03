import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

export function JobCard({ job }) {
  // Calculate days ago
  const postedDate = new Date(job.postedDate)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - postedDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Get company initials for avatar
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="group bg-white rounded-3xl shadow-lg border border-blue-200/50 p-8 hover:shadow-2xl hover:border-blue-400/50 transition-all duration-700 hover-lift hover:scale-105 relative overflow-hidden hover:shadow-blue-500/10">
      {/* Header with Company Avatar */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start space-x-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-blue-300/10 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
            {getCompanyInitials(job.company)}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-all duration-500">
              <Link to={`/jobs/${job.id}`} className="hover:underline decoration-blue-400/40 underline-offset-4">
                {job.title}
              </Link>
            </h3>
            <p className="text-xl font-semibold text-muted-foreground group-hover:text-foreground transition-all duration-500">
              {job.company}
            </p>
          </div>
        </div>
        
        <Badge 
          variant={job.type === "Full-time" ? "default" : "outline"} 
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-500 hover:scale-110 ${
            job.type === "Full-time" 
              ? "bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-700 border-2 border-blue-400/30 hover:border-blue-500/50 hover:bg-blue-400/30 shadow-lg" 
              : "bg-gradient-to-r from-gray-200/60 to-gray-300/40 text-gray-700 border-2 border-gray-400/40 hover:border-gray-500/60 hover:bg-gray-400/70 shadow-md"
          }`}
        >
          {job.type}
        </Badge>
      </div>

      {/* Job Details */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-all duration-500">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100/60 to-blue-200/40 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200/50 group-hover:scale-110 transition-all duration-500 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span className="font-semibold text-base">{job.location}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-all duration-500">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100/60 to-blue-200/40 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200/50 group-hover:scale-110 transition-all duration-500 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="font-semibold text-base">{job.salary}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-all duration-500">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100/60 to-blue-200/40 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200/50 group-hover:scale-110 transition-all duration-500 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <span className="font-semibold text-base">
            Posted {diffDays} {diffDays === 1 ? "day" : "days"} ago
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-8 line-clamp-2 group-hover:text-foreground transition-all duration-500 leading-relaxed text-base">
        {job.description}
      </p>

      {/* Requirements */}
      <div className="mb-8">
        <h4 className="font-bold mb-4 text-foreground text-lg">Requirements:</h4>
        <div className="flex flex-wrap gap-3">
          {job.requirements.slice(0, 3).map((req, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gradient-to-r from-blue-100/60 to-blue-200/40 text-blue-700 rounded-full text-sm font-semibold group-hover:bg-blue-200/50 group-hover:text-blue-800 group-hover:scale-110 transition-all duration-500 shadow-md border border-blue-200/30 group-hover:border-blue-300/50"
            >
              {req}
            </span>
          ))}
          {job.requirements.length > 3 && (
            <span className="px-4 py-2 bg-gradient-to-r from-gray-100/60 to-gray-200/40 text-gray-600 rounded-full text-sm font-medium border border-gray-200/20 shadow-sm">
              +{job.requirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          asChild 
          variant="outline" 
          size="lg"
          className="flex-1 h-12 rounded-2xl border-2 border-blue-300/50 hover:border-blue-500/50 hover:bg-blue-50 transition-all duration-500 group-hover:shadow-lg group-hover:scale-105 font-semibold"
        >
          <Link to={`/jobs/${job.id}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-5 w-5"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View Details
          </Link>
        </Button>
        
        <Button 
          asChild 
          size="lg"
          className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 group-hover:shadow-blue-500/25 font-semibold"
        >
          <Link to={`/jobs/${job.id}/apply`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-5 w-5"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c-1 0-2.4-.4-3.5-1.5-2.1-2.1-2.1-5.4 0-7.5C18.6 2.4 19 1 19 1" />
              <path d="M21 12c1 0 2.4-.4 3.5-1.5 2.1-2.1 2.1-5.4 0-7.5C23.4 2.4 23 1 23 1" />
            </svg>
            Apply Now
          </Link>
        </Button>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-3xl pointer-events-none" />
      
      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 group-hover:scale-150 pointer-events-none" />
    </div>
  )
}