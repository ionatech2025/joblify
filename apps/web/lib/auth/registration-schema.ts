import { z } from 'zod';
import { INDUSTRY_OPTIONS, SIZE_VALUES } from '@/app/company/company-profile-schema';

export const PHONE_REGEX = /^\d{10}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const JobseekerRegistrationSchema = z
  .object({
    userType: z.literal('JOB_SEEKER').default('JOB_SEEKER'),
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
    phone: z.string().trim().regex(PHONE_REGEX, 'Phone number must be exactly 10 numeric digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Password must contain both letters and numbers'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type JobseekerRegistrationInput = z.infer<typeof JobseekerRegistrationSchema>;

export const CompanyRegistrationSchema = z
  .object({
    userType: z.literal('COMPANY').default('COMPANY'),
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(140),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Password must contain both letters and numbers'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    industry: z.enum(INDUSTRY_OPTIONS, {
      errorMap: () => ({ message: 'Please select a valid industry' }),
    }),
    companySize: z.enum(SIZE_VALUES, {
      errorMap: () => ({ message: 'Please select a valid company size' }),
    }),
    description: z.string().trim().min(20, 'Description must be at least 20 characters'),
    contactPersonName: z.string().trim().min(1, 'Contact person name is required'),
    contactPersonPosition: z.string().trim().min(1, 'Contact person position is required'),
    phone: z.string().trim().regex(PHONE_REGEX, 'Phone number must be exactly 10 numeric digits'),
    address: z.string().trim().min(1, 'Address is required').optional().or(z.literal('')),
    website: z.string().trim().url('Invalid website URL').optional().or(z.literal('')),
    linkedin: z.string().trim().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    logoUrl: z.string().trim().url('Invalid logo URL').optional().or(z.literal('')),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CompanyRegistrationInput = z.infer<typeof CompanyRegistrationSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  phone: z.string().trim().regex(PHONE_REGEX, 'Phone number must be exactly 10 numeric digits').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof LoginSchema>;
