'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent } from '../components/ui/card';
import { localStorageUtils } from '../utils/localStorage';

// ── Eye Icons ──────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ── Reusable Password Input ────────────────────────────────
function PasswordInput({ value, onChange, placeholder, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────
function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl mb-6 text-sm font-medium ${
      isError
        ? 'bg-red-500/10 border border-red-500/25 text-red-400'
        : 'bg-green-500/10 border border-green-500/25 text-green-400'
    }`}>
      <span className="text-base flex-shrink-0">{isError ? '❌' : '✅'}</span>
      <span>{message}</span>
    </div>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('jobseeker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    terms: false,
    // job seeker
    firstName: '',
    lastName: '',
    // company
    companyName: '',
    industry: '',
    description: '',
    size: '',
    establishmentYear: '',
    address: '',
    website: '',
    linkedin: '',
    fullName: '',
    position: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // ── SUBMIT ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side checks
    if (!formData.terms) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }
    if (formData.password.length < 8 || !/\d/.test(formData.password) || !/[a-zA-Z]/.test(formData.password)) {
      setError('Password must be at least 8 characters and include both letters and numbers.');
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      // Build payload — terms must be boolean true
      const payload = accountType === 'jobseeker'
        ? {
            userType: 'jobseeker',
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            terms: true,  // boolean true — backend requires this
          }
        : {
            userType: 'company',
            companyName: formData.companyName.trim(),
            industry: formData.industry.trim(),
            description: formData.description.trim(),
            size: formData.size.trim(),
            establishmentYear: formData.establishmentYear.trim(),
            address: formData.address.trim(),
            website: formData.website.trim(),
            linkedin: formData.linkedin.trim(),
            fullName: formData.fullName.trim(),
            position: formData.position.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            terms: true,  // boolean true — backend requires this
          };

      console.log('📤 Sending payload:', payload);

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (!response.ok || !data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Success
      setSuccess(data.message || 'Account created successfully!');

      if (accountType === 'jobseeker') {
        localStorageUtils.setSignupData(formData.email, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: 'JOB_SEEKER',
        });
      }

      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Account created successfully! Please sign in.',
            accountType,
          },
        });
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "h-14 bg-zinc-900 border-zinc-700 rounded-2xl text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20";
  const inputClassAmber = "h-14 bg-zinc-900 border-zinc-700 rounded-2xl text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20";

  /* ── JOB SEEKER FORM ── */
  const renderJobSeekerForm = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-3xl flex items-center justify-center border border-white/10 text-4xl">
          👤
        </div>
        <h2 className="text-4xl font-semibold tracking-tighter mb-3">Join as a Job Seeker</h2>
        <p className="text-zinc-400">Create your account and discover your next opportunity</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-zinc-300 mb-2 block">First Name *</Label>
            <Input value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className={inputClass} placeholder="John" required />
          </div>
          <div>
            <Label className="text-zinc-300 mb-2 block">Last Name *</Label>
            <Input value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} className={inputClass} placeholder="Doe" required />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Email Address *</Label>
          <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={inputClass} placeholder="john@example.com" required />
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Phone Number *</Label>
          <Input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className={inputClass} placeholder="1234567890" required />
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Password *</Label>
          <PasswordInput
            value={formData.password}
            onChange={e => handleInputChange('password', e.target.value)}
            placeholder="Min. 8 chars with letters & numbers"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 mt-1.5 ml-1">At least 8 characters with letters and numbers</p>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Confirm Password *</Label>
          <PasswordInput
            value={formData.confirmPassword}
            onChange={e => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Repeat your password"
            className={inputClass}
          />
        </div>

        {/* Terms checkbox — must be checked for terms: true to be sent */}
        <div
          onClick={() => handleInputChange('terms', !formData.terms)}
          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
            formData.terms
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
            formData.terms ? 'bg-blue-600 border-blue-600' : 'border-zinc-600'
          }`}>
            {formData.terms && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-zinc-400 leading-relaxed select-none">
            I agree to the{' '}
            <Link to="/terms" onClick={e => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 font-semibold">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" onClick={e => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 font-semibold">Privacy Policy</Link>
          </span>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : 'Create Job Seeker Account'}
        </Button>
      </form>
    </div>
  );

  /* ── COMPANY FORM ── */
  const renderCompanyForm = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl flex items-center justify-center border border-white/10 text-4xl">
          🏢
        </div>
        <h2 className="text-4xl font-semibold tracking-tighter mb-3">Join as a Company</h2>
        <p className="text-zinc-400">Post jobs and hire top talent easily</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-zinc-300 mb-2 block">Company Name *</Label>
          <Input value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} className={inputClassAmber} placeholder="Your Company Name" required />
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Industry *</Label>
          <Input value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} className={inputClassAmber} placeholder="e.g. Technology, Finance, Healthcare" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-zinc-300 mb-2 block">Company Size *</Label>
            <Input value={formData.size} onChange={e => handleInputChange('size', e.target.value)} className={inputClassAmber} placeholder="e.g. 1-50" required />
          </div>
          <div>
            <Label className="text-zinc-300 mb-2 block">Year Established *</Label>
            <Input value={formData.establishmentYear} onChange={e => handleInputChange('establishmentYear', e.target.value)} className={inputClassAmber} placeholder="e.g. 2010" required />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Company Description *</Label>
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Briefly describe your company..."
            rows={3}
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none text-sm transition-all"
          />
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Address *</Label>
          <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} className={inputClassAmber} placeholder="Company address" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-zinc-300 mb-2 block">Website</Label>
            <Input value={formData.website} onChange={e => handleInputChange('website', e.target.value)} className={inputClassAmber} placeholder="https://yourcompany.com" />
          </div>
          <div>
            <Label className="text-zinc-300 mb-2 block">LinkedIn</Label>
            <Input value={formData.linkedin} onChange={e => handleInputChange('linkedin', e.target.value)} className={inputClassAmber} placeholder="LinkedIn URL" />
          </div>
        </div>

        {/* Contact Person */}
        <div className="pt-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="flex-1 h-px bg-zinc-800" />
            Contact Person
            <span className="flex-1 h-px bg-zinc-800" />
          </p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-zinc-300 mb-2 block">Full Name *</Label>
                <Input value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} className={inputClassAmber} placeholder="Contact full name" required />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2 block">Position *</Label>
                <Input value={formData.position} onChange={e => handleInputChange('position', e.target.value)} className={inputClassAmber} placeholder="e.g. HR Manager" required />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 mb-2 block">Contact Email *</Label>
              <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={inputClassAmber} placeholder="contact@company.com" required />
            </div>
            <div>
              <Label className="text-zinc-300 mb-2 block">Phone *</Label>
              <Input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className={inputClassAmber} placeholder="Contact phone number" required />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Password *</Label>
          <PasswordInput
            value={formData.password}
            onChange={e => handleInputChange('password', e.target.value)}
            placeholder="Min. 8 chars with letters & numbers"
            className={inputClassAmber}
          />
          <p className="text-xs text-zinc-500 mt-1.5 ml-1">At least 8 characters with letters and numbers</p>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Confirm Password *</Label>
          <PasswordInput
            value={formData.confirmPassword}
            onChange={e => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Repeat your password"
            className={inputClassAmber}
          />
        </div>

        {/* Terms checkbox */}
        <div
          onClick={() => handleInputChange('terms', !formData.terms)}
          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
            formData.terms
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
            formData.terms ? 'bg-amber-600 border-amber-600' : 'border-zinc-600'
          }`}>
            {formData.terms && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-zinc-400 leading-relaxed select-none">
            I agree to the{' '}
            <Link to="/terms" onClick={e => e.stopPropagation()} className="text-amber-400 hover:text-amber-300 font-semibold">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" onClick={e => e.stopPropagation()} className="text-amber-400 hover:text-amber-300 font-semibold">Privacy Policy</Link>
          </span>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-2xl text-lg font-semibold shadow-lg shadow-amber-600/25 hover:shadow-amber-600/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : 'Create Company Account'}
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
                  onClick={() => { setAccountType('jobseeker'); setError(''); setSuccess(''); }}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    accountType === 'jobseeker'
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  👤 Job Seeker
                </button>
                <button
                  onClick={() => { setAccountType('company'); setError(''); setSuccess(''); }}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    accountType === 'company'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}