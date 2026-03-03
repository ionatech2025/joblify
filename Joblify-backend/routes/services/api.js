const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for sessions/cookies
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Jobseeker endpoints
  async getJobseekerDashboard() {
    return this.request('/jobseeker/dashboard');
  }

  async getJobseekerProfile() {
    return this.request('/jobseeker/profile');
  }

  async getCompanies(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/jobseeker/companies?${params}`);
  }

  async getJobPosts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/jobseeker/jobs?${params}`);
  }

  async applyToJob(jobId, applicationData) {
    return this.request(`/jobseeker/jobs/${jobId}/apply`, {
      method: 'POST',
      body: applicationData,
    });
  }

  async subscribeToCompany(companyId, profileType) {
    return this.request(`/jobseeker/companies/${companyId}/subscribe`, {
      method: 'POST',
      body: { profileType },
    });
  }
}

export const apiService = new ApiService();