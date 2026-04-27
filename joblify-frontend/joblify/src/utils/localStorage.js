// localStorage utility functions for user data management

export const localStorageUtils = {
  // Safely get and parse user data
  getUserData() {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) return null;
      
      const userData = JSON.parse(storedUser);
      return userData;
    } catch (error) {
      console.error('Error getting user data from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
      return null;
    }
  },

  // Safely store user data
  setUserData(userData) {
    try {
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error storing user data to localStorage:', error);
      return false;
    }
  },

  // Store user data during signup
  storeSignupData(email, userData) {
    try {
      const key = `userData_${email.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error storing signup data to localStorage:', error);
      return false;
    }
  },

  // Get user data during login
  getSignupData(email) {
    try {
      const key = `userData_${email.toLowerCase()}`;
      const storedData = localStorage.getItem(key);
      if (!storedData) return null;
      
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error getting signup data from localStorage:', error);
      return null;
    }
  },

  // Clear user session
  clearUserSession() {
    try {
      localStorage.removeItem('currentUser');
      return true;
    } catch (error) {
      console.error('Error clearing user session from localStorage:', error);
      return false;
    }
  },

  // Check if user is logged in
  isUserLoggedIn() {
    const userData = this.getUserData();
    return userData !== null && userData.role;
  }
};
