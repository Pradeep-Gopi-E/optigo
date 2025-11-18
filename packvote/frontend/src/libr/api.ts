import axios from 'axios';

// Base URL of your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

// --- ADDED THIS TYPE DEFINITION ---
export type Trip = {
  id: string;
  title: string; 
  description?: string | null;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status: string;
  participant_count: number;
};
// --- END OF ADDITION ---


// --- Helper Function ---
/**
 * Gets the auth token from localStorage and returns auth headers.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    // This will be caught by your page and trigger a redirect to login
    throw new Error('No access token found.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// --- Authentication API ---
/**
 * API functions for authentication (login, register, updateProfile)
 */
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name,
      email,
      password,
    });
    return response.data;
  },

  updateProfile: async (data: { name: string; telegram_id?: string }) => {
    const headers = getAuthHeaders();
    const response = await axios.patch(`${API_BASE_URL}/api/user/profile`, data, { headers });
    return response.data;
  },
};

// --- Trips API ---
/**
 * API functions for managing trips
 */
export const tripsAPI = {
  /**
   * Fetches all trips for the current user.
   */
  getTrips: async () => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/trips`, { headers });
    return response.data;
  },

  /**
   * Fetches a single trip by its ID.
   */
  getTrip: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/trips/${tripId}`, { headers });
    return response.data;
  },

  /**
   * --- UPDATED THIS FUNCTION ---
   * Create a new trip
   */
  createTrip: async (data: {
    title: string; // Renamed from 'title' to 'name' to match backend
    description?: string;
    destination?: string;
    start_date?: string | null;
    end_date?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
  }) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/trips`, data, { headers });
    return response.data;
  },

  /**
   * Delete a trip by ID
   */
  deleteTrip: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/api/trips/${tripId}`, { headers });
    return response.data;
  },

  /**
   * Creates/updates preferences for a specific trip.
   */
  createPreference: async (tripId: string, data: any) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/trips/${tripId}/preferences`, data, { headers });
    return response.data;
  },
};

// --- Recommendations API ---
/**
 * API functions for getting recommendations
 */
export const recommendationsAPI = {
  /**
   * Fetches existing recommendations for a trip.
   */
  getRecommendations: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/trips/${tripId}/recommendations`, { headers });
    return response.data;
  },

  /**
   * Triggers the AI to generate new recommendations for a trip.
   */
  generateRecommendations: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/trips/${tripId}/generate_recommendations`, {}, { headers });
    return response.data;
  },
};

// --- Telegram API ---
/**
 * API functions for Telegram integration
 */
export const telegramAPI = {
  /**
   * Sends a test message to the currently authenticated user.
   */
  sendTestMessage: async () => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/telegram/send_test`, {}, { headers });
    return response.data;
  },

  /**
   * Sends survey invitations to all participants of a trip.
   */
  sendSurveyInvitation: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/trips/${tripId}/send_survey`, {}, { headers });
    return response.data;
  },
};