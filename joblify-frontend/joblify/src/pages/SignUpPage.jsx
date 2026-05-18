'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent } from '../components/ui/card';
import { motion } from "framer-motion";
import { localStorageUtils } from '../utils/localStorage';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('jobseeker');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    terms: false,
    firstName: '',
    lastName: '',
    companyName: '',
    industry: '',
    description: '',
    size: '',
    establishmentYear: '',
    address: '',
    website: '',
    linkedin: '',
    contactPersonName: '',
    contactPersonPosition: '',
    contactPhone: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", formData);
    // Add your actual submit logic here
  };

  /* ==================== JOB SEEKER FORM ==================== */
  const renderJobSeekerForm = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-3xl flex items-center justify-center border border-white/10">
          👤
        </div>
        <h2 className="text-4xl font-semibold tracking-tighter mb-3">Join as a Job Seeker</h2>
        <p className="text-zinc-400">Create your account and discover your next opportunity</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-zinc-300">First Name *</Label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="h-14 bg-zinc-950 border-white/10 rounded-2xl focus:border-blue-500"
              placeholder="John"
            />
          </div>
          <div>
            <Label className="text-zinc-300">Last Name *</Label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="h-14 bg-zinc-950 border-white/10 rounded-2xl focus:border-blue-500"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300">Email Address *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="h-14 bg-zinc-950 border-white/10 rounded-2xl focus:border-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <Label className="text-zinc-300">Phone Number *</Label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="h-14 bg-zinc-950 border-white/10 rounded-2xl focus:border-blue-500"
            placeholder="1234567890"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-2xl text-lg font-semibold"
        >
          {isSubmitting ? "Creating Account..." : "Create Job Seeker Account"}
        </Button>
      </form>
    </div>
  );

  /* ==================== COMPANY FORM ==================== */
  const renderCompanyForm = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl flex items-center justify-center border border-white/10">
          🏢
        </div>
        <h2 className="text-4xl font-semibold tracking-tighter mb-3">Join as a Company</h2>
        <p className="text-zinc-400">Post jobs and hire top talent easily</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-zinc-300">Company Name *</Label>
          <Input
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="h-14 bg-zinc-950 border-white/10 rounded-2xl focus:border-amber-500"
            placeholder="Your Company Name"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-2xl text-lg font-semibold"
        >
          {isSubmitting ? "Creating Account..." : "Create Company Account"}
        </Button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Account Type Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-1.5 shadow-2xl">
              <div className="flex">
                <button
                  onClick={() => setAccountType('jobseeker')}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
                    accountType === 'jobseeker' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  👤 Job Seeker
                </button>
                <button
                  onClick={() => setAccountType('company')}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
                    accountType === 'company' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  🏢 Company
                </button>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <Card className="bg-zinc-900 border border-white/10 shadow-2xl">
            <CardContent className="p-10">
              {accountType === 'jobseeker' ? renderJobSeekerForm() : renderCompanyForm()}
            </CardContent>
          </Card>

          <div className="text-center mt-8 text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}