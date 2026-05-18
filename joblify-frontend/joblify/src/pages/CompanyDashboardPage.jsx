"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { localStorageUtils } from '../utils/localStorage';

import {
  Building2, Briefcase, Users, Search, Clock, FileText, Edit, MessageCircle,
  UserPlus, BarChart3, MapPin, Globe, Send, X, Users2, TrendingUp, Plus
} from 'lucide-react';

export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [applicants, setApplicants] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);

  // Modal States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showVIChatModal, setShowVIChatModal] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);

  const [selectedJob, setSelectedJob] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const [chatAreaName, setChatAreaName] = useState('');
  const [chatAreaDescription, setChatAreaDescription] = useState('');
  const [selectedChatType, setSelectedChatType] = useState('');
  const [isCreatingChatArea, setIsCreatingChatArea] = useState(false);
  const [chatAreaSuccess, setChatAreaSuccess] = useState(false);

  // ... (Keep all your useEffect and handler logic the same - only UI is changed)

  // I'll keep the logic intact and focus on the UI redesign below

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-950">
        <Sidebar userType="COMPANY" onLogout={handleLogout} onOpenVIChat={() => setShowCombinedModal(true)} onOpenApplicants={() => setShowApplicantsModal(true)} />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar 
        userType="COMPANY" 
        onLogout={handleLogout} 
        onOpenVIChat={() => setShowCombinedModal(true)} 
        onOpenApplicants={() => setShowApplicantsModal(true)} 
      />

      <main className="flex-1 lg:ml-64 transition-all duration-300 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-3xl flex items-center justify-center border border-white/10">
              {company?.logo ? (
                <img src={company.logo} alt={company.name} className="w-20 h-20 rounded-2xl" />
              ) : (
                <span className="text-6xl">🏢</span>
              )}
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-4">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">{company?.name}</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Here's what's happening with your hiring today.
            </p>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Badge variant="outline" className="px-4 py-2 border-white/10">
                <MapPin className="w-4 h-4 mr-2" /> {company?.location}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 border-white/10">
                <Building2 className="w-4 h-4 mr-2" /> {company?.industry}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 border-white/10">
                <Users className="w-4 h-4 mr-2" /> {company?.size}
              </Badge>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {[
              { label: "Jobs Posted", value: metrics.jobsPosted, icon: Briefcase, color: "blue" },
              { label: "Applicants", value: metrics.applicantsThisMonth, icon: Users, color: "violet" },
              { label: "Open Roles", value: metrics.openPositions, icon: Plus, color: "emerald" },
              { label: "Total Views", value: metrics.totalViews, icon: BarChart3, color: "amber" },
              { label: "Avg Rating", value: metrics.averageRating, icon: TrendingUp, color: "rose" },
              { label: "Response Rate", value: `${metrics.responseRate}%`, icon: MessageCircle, color: "sky" },
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-zinc-900 border-white/10 hover:border-white/20 transition-all group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl bg-${metric.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <metric.icon className={`w-6 h-6 text-${metric.color}-400`} />
                    </div>
                    <div className="text-4xl font-semibold mb-1">{metric.value}</div>
                    <div className="text-sm text-zinc-400">{metric.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <ActionCard 
              icon={Edit} color="blue" title="Update Profile" 
              desc="Keep your company attractive to talent" 
              link="/company/profile" 
            />
            <ActionCard 
              icon={Plus} color="violet" title="Post New Job" 
              desc="Reach top candidates instantly" 
              link="/post-job" 
            />
            <ActionCard 
              icon={Users} color="emerald" title="View Applicants" 
              desc="Review & manage applications" 
              onClick={() => setShowApplicantsModal(true)} 
            />
            <ActionCard 
              icon={MessageCircle} color="amber" title="Communication" 
              desc="Broadcast or create chat areas" 
              onClick={() => setShowCombinedModal(true)} 
            />
          </div>

          {/* Recent Applicants */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Recent Applicants</h2>
              <Button variant="outline" onClick={() => setShowApplicantsModal(true)}>
                View All Applicants
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applicants.slice(0, 6).map((applicant, index) => (
                <ApplicantCard key={applicant.id} applicant={applicant} index={index} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-8">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <ActivityCard key={i} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modals - Keep your existing modal logic but with updated premium styling */}
      {/* (I can provide updated modal versions if you want - just say so) */}

    </div>
  );
}

/* ====================== Reusable Premium Components ====================== */

function ActionCard({ icon: Icon, color, title, desc, link, onClick }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
      <Card 
        className="bg-zinc-900 border border-white/10 hover:border-white/30 h-full group cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-8">
          <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-7 h-7 text-${color}-400`} />
          </div>
          <h3 className="text-2xl font-semibold mb-3">{title}</h3>
          <p className="text-zinc-400 leading-relaxed">{desc}</p>
          {link && (
            <Button asChild className="mt-6 w-full">
              <Link to={link}>Go Now →</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ApplicantCard({ applicant, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -8 }}
    >
      <Card className="bg-zinc-900 border-white/10 hover:border-blue-500/30 overflow-hidden group">
        <CardContent className="p-7">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={applicant.avatar}
              alt={applicant.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
            />
            <div>
              <h4 className="font-semibold text-lg">{applicant.name}</h4>
              <p className="text-blue-400 text-sm">{applicant.position}</p>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-5 text-zinc-400">
            <span>{applicant.experience}</span>
            <span>{applicant.location}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {applicant.skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs border-white/10">{skill}</Badge>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 text-sm" size="sm">View Profile</Button>
            <Button className="flex-1 text-sm" size="sm">Message</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActivityCard({ activity }) {
  return (
    <Card className="bg-zinc-900/70 border-white/10 hover:bg-zinc-900 transition-colors">
      <CardContent className="p-6 flex items-center gap-5">
        <div className="text-3xl">{activity.icon}</div>
        <div className="flex-1">
          <p className="font-medium">{activity.message}</p>
          <p className="text-sm text-zinc-500">{activity.details}</p>
        </div>
        <div className="text-xs text-zinc-500 whitespace-nowrap">
          {formatTimeAgo(activity.timestamp)}
        </div>
      </CardContent>
    </Card>
  );
}