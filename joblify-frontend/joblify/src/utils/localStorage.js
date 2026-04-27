// localStorage utility functions for user data management

export const localStorageUtils = {
  // Check if localStorage is available
  isLocalStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('localStorage is not available:', e);
      return false;
    }
  },

  // Safely get and parse user data
  getUserData() {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, returning null');
        return null;
      }

      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        console.log('No user data found in localStorage');
        return null;
      }

      const userData = JSON.parse(storedUser);
      console.log('Successfully retrieved user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error getting user data from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('currentUser');
      } catch (clearError) {
        console.error('Error clearing corrupted data:', clearError);
      }
      return null;
    }
  },

  // Safely store user data
  setUserData(userData) {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.error('localStorage not available, cannot store user data');
        return false;
      }

      const dataString = JSON.stringify(userData);
      localStorage.setItem('currentUser', dataString);
      console.log('Successfully stored user data:', userData);
      return true;
    } catch (error) {
      console.error('Error storing user data to localStorage:', error);
      return false;
    }
  },

  // Store user data during signup
  storeSignupData(email, userData) {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.error('localStorage not available, cannot store signup data');
        return false;
      }

      const key = `userData_${email.toLowerCase()}`;
      const dataString = JSON.stringify(userData);
      localStorage.setItem(key, dataString);
      console.log('Successfully stored signup data for:', email);
      return true;
    } catch (error) {
      console.error('Error storing signup data to localStorage:', error);
      return false;
    }
  },

  // Get user data during login
  getSignupData(email) {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, returning null for signup data');
        return null;
      }

      const key = `userData_${email.toLowerCase()}`;
      const storedData = localStorage.getItem(key);
      if (!storedData) return null;

      const userData = JSON.parse(storedData);
      console.log('Successfully retrieved signup data for:', email);
      return userData;
    } catch (error) {
      console.error('Error getting signup data from localStorage:', error);
      return null;
    }
  },

  // Clear user session
  clearUserSession() {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, cannot clear session');
        return false;
      }

      localStorage.removeItem('currentUser');
      console.log('Successfully cleared user session');
      return true;
    } catch (error) {
      console.error('Error clearing user session from localStorage:', error);
      return false;
    }
  },

  // Check if user is logged in
  isUserLoggedIn() {
    const userData = this.getUserData();
    const isLoggedIn = userData !== null && userData.role;
    console.log('User login status:', isLoggedIn);
    return isLoggedIn;
  },
};
