import type { CompanyProfile } from '@prisma/client';
import type { CompanyProfileInput } from '@/app/company/company-profile-schema';

// The stored profile as CompanySettingsForm's initial values. Shared by
// /company/settings and the resubmit form on /employer-setup.
export function profileFormValues(
  profile: CompanyProfile,
  phone: string | null,
): CompanyProfileInput {
  return {
    companyName: profile.companyName,
    industry: profile.industry,
    companySize: profile.companySize,
    description: profile.description,
    address: profile.address ?? '',
    phone: phone ?? '',
    contactPersonName: profile.contactPersonName ?? '',
    contactPersonPosition: profile.contactPersonPosition ?? '',
    website: profile.website ?? '',
    linkedin: profile.linkedin ?? '',
  };
}
