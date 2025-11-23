import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL of your FastAPI backend
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api`;

// --- Type Definitions ---

export interface User {
  id: string;
  email: string;
  name: string;
  telegram_id?: string;
  created_at: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string | null;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  expected_participants?: number | null;
  invite_code?: string | null;
  status: 'planning' | 'voting' | 'confirmed' | 'cancelled';
  allow_member_recommendations: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export interface Participant {
  id: string;
  user_id: string;
  trip_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'joined' | 'invited' | 'declined';
  joined_at?: string;
  user_name: string;
  user_email: string;
  vote_status?: 'not_voted' | 'voted' | 'skipped';
}

export interface TripDetail extends Trip {
  participants: Participant[];
}

export interface Recommendation {
  id: string;
  trip_id: string;
  destination_name: string;
  description?: string;
  estimated_cost?: number;
  activities: string[];
  accommodation_options: string[];
  ai_generated: boolean;
  created_by?: string;
  created_at: string;
  vote_count?: number;
  rank_score?: number;
  meta?: any;
  weather_info?: string;
}

export interface Vote {
  id: string;
  trip_id: string;
  user_id: string;
  recommendation_id: string;
  rank: number;
  created_at?: string;
  destination_name?: string;
  description?: string;
}

export interface VotingResult {
  winner?: {
    id: string;
    destination_name: string;
    description: string;
  };
  scores: Record<string, number>;
  total_voters: number;
  total_candidates: number;
  candidates: Array<{ id: string; name: string }>;
  message?: string;
}

export interface UserVoteSummary {
  user_id: string;
  user_name: string;
  has_voted: boolean;
  vote_count: number;
}

export interface Preference {
  id: string;
  trip_id: string;
  user_id: string;
  preference_type: string;
  preference_data: any;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface SurveyResponse {
  trip_id: string;
  user_preferences: Preference[];
  completion_status: Record<string, boolean>;
  overall_complete: boolean;
}

// --- Helper Function ---
/**
 * Gets the auth token from localStorage and returns auth headers.
 */
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('access_token');
  if (!token) {
    // This will be caught by your page and trigger a redirect to login
    throw new Error('No access token found.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// --- Axios Interceptor for Global Error Handling ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }
      // Handle 500 Server Errors
      if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    }
    return Promise.reject(error);
  }
);

// --- Authentication API ---
export const authAPI = {
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  },

  login: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  },

  getMe: async () => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
    return response.data;
  },

  updateProfile: async (data: { name?: string; telegram_id?: string; location?: string }) => {
    const headers = getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/auth/me`, data, { headers });
    return response.data;
  },

  logout: async () => {
    // Client-side logout is just clearing tokens, but we can call backend if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    return { message: 'Logged out successfully' };
  }
};

// --- Trips API ---
export const tripsAPI = {
  getTrips: async (params?: { skip?: number; limit?: number }) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips`, { headers, params });
    return response.data;
  },

  getTrip: async (tripId: string): Promise<TripDetail> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}`, { headers });
    return response.data;
  },

  createTrip: async (data: any) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips`, data, { headers });
    return response.data;
  },

  updateTrip: async (tripId: string, data: any) => {
    const headers = getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/trips/${tripId}`, data, { headers });
    return response.data;
  },

  deleteTrip: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/trips/${tripId}`, { headers });
    return response.data;
  },

  getParticipants: async (tripId: string): Promise<Participant[]> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/participants`, { headers });
    return response.data;
  },

  inviteParticipants: async (tripId: string, data: { emails: string[]; message?: string }) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/participants/invite`, data, { headers });
    return response.data;
  },

  removeParticipant: async (tripId: string, participantId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/trips/${tripId}/participants/${participantId}`, { headers });
    return response.data;
  },

  joinTrip: async (inviteCode: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/join/${inviteCode}`, {}, { headers });
    return response.data;
  },
};

// --- Recommendations API ---
export const recommendationsAPI = {
  getRecommendations: async (tripId: string): Promise<Recommendation[]> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/recommendations`, { headers });
    return response.data;
  },

  getRecommendation: async (tripId: string, recId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/recommendations/${recId}`, { headers });
    return response.data;
  },

  generateRecommendations: async (tripId: string, clearExisting: boolean = true) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/recommendations/generate`, { clear_existing: clearExisting }, { headers });
    return response.data;
  },

  createRecommendation: async (tripId: string, data: any) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/recommendations`, data, { headers });
    return response.data;
  },

  deleteRecommendation: async (tripId: string, recId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/trips/${tripId}/recommendations/${recId}`, { headers });
    return response.data;
  },
};

// --- Votes API ---
export const votesAPI = {
  castVotes: async (tripId: string, data: { votes: { recommendation_id: string; rank: number }[] }) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/votes`, data, { headers });
    return response.data;
  },

  getResults: async (tripId: string): Promise<VotingResult> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/votes/results`, { headers });
    return response.data;
  },

  getMyVotes: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/votes/my-votes`, { headers });
    return response.data;
  },

  getVotingSummary: async (tripId: string): Promise<UserVoteSummary[]> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/votes/summary`, { headers });
    return response.data;
  },

  skipVote: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/votes/skip`, {}, { headers });
    return response.data;
  },

  resetVotes: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/votes/reset`, {}, { headers });
    return response.data;
  },

  finalizeVoting: async (tripId: string): Promise<VotingResult> => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/votes/finalize`, {}, { headers });
    return response.data;
  },
};

// --- Preferences API ---
export const preferencesAPI = {
  getPreferences: async (tripId: string): Promise<Preference | null> => {
    const headers = getAuthHeaders();
    try {
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/preferences`, { headers });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createPreference: async (tripId: string, preferences: any) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/preferences`, preferences, { headers });
    return response.data;
  },
};

// --- Telegram API ---
export const telegramAPI = {
  sendSurveyInvitation: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/telegram/send-survey-invitation`, { trip_id: tripId }, { headers });
    return response.data;
  },

  sendVotingNotification: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/telegram/send-voting-notification`, { trip_id: tripId }, { headers });
    return response.data;
  },

  getParticipantsStats: async (tripId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/telegram/participants-stats/${tripId}`, { headers });
    return response.data;
  },

  getBotInfo: async () => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/telegram/bot-info`, { headers });
    return response.data;
  },
};