import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// TypeScript Interfaces
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
  description?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget_min?: number;
  budget_max?: number;
  status: 'planning' | 'voting' | 'confirmed' | 'cancelled';
  owner_id: string;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface TripDetail extends Trip {
  participants: Participant[];
}

export interface Participant {
  id: string;
  user_id: string;
  trip_id: string;
  role: 'owner' | 'member' | 'admin';
  status: 'joined' | 'invited' | 'declined';
  joined_at?: string;
  user_name?: string;
  user_email?: string;
}

export interface Recommendation {
  id: string;
  trip_id: string;
  destination: string;
  destination_name: string;
  description?: string;
  estimated_cost?: number;
  ai_generated: boolean;
  ai_reasoning?: string;
  created_by_id?: string;
  created_at: string;
  activities?: string[];
  accommodation_options?: string[];
  tags?: string[];
}

export interface Vote {
  id: string;
  trip_id: string;
  user_id: string;
  recommendation_id: string;
  rank: number;
  created_at: string;
}

export interface VotingResult {
  trip_id: string;
  results: {
    recommendation_id: string;
    destination: string;
    total_score: number;
    vote_count: number;
    average_rank: number;
  }[];
  total_voters: number;
  voting_complete: boolean;
}

export interface UserVoteSummary {
  user_id: string;
  user_name: string;
  has_voted: boolean;
  vote_count: number;
  voted_at?: string;
}

export interface Preference {
  id: string;
  trip_id: string;
  user_id: string;
  preference_type: string;
  value: string;
  priority?: number;
  created_at: string;
}

export interface SurveyResponse {
  trip_id: string;
  user_id: string;
  preferences: Preference[];
  completed: boolean;
}

export interface TripCreate {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface TripUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget_min?: number;
  budget_max?: number;
  status?: 'planning' | 'voting' | 'confirmed' | 'cancelled';
}

export interface RecommendationCreate {
  destination: string;
  description?: string;
  estimated_cost?: number;
  activities?: string[];
}

export interface PreferenceCreate {
  preference_type: string;
  value: string;
  priority?: number;
}

export interface PreferenceUpdate {
  value?: string;
  priority?: number;
}

export interface SurveySubmit {
  preferences: Array<{
    preference_type: string;
    value: string;
    priority?: number;
  }>;
}

export interface InviteRequest {
  emails: string[];
  message?: string;
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authorization header
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    } else if (error.response?.status === 500) {
      // Server error
      toast.error('Server error. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; telegram_id?: string }) => {
    const response = await apiClient.put('/auth/me', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

// Trips API
export const tripsAPI = {
  getTrips: async (params?: { skip?: number; limit?: number }): Promise<Trip[]> => {
    const response = await apiClient.get('/trips', { params });
    return response.data;
  },

  getTrip: async (tripId: string): Promise<TripDetail> => {
    const response = await apiClient.get(`/trips/${tripId}`);
    return response.data;
  },

  createTrip: async (data: TripCreate): Promise<Trip> => {
    const response = await apiClient.post('/trips', data);
    return response.data;
  },

  updateTrip: async (tripId: string, data: TripUpdate): Promise<Trip> => {
    const response = await apiClient.put(`/trips/${tripId}`, data);
    return response.data;
  },

  deleteTrip: async (tripId: string): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}`);
  },

  getParticipants: async (tripId: string): Promise<Participant[]> => {
    const response = await apiClient.get(`/trips/${tripId}/participants`);
    return response.data;
  },

  inviteParticipants: async (tripId: string, data: InviteRequest) => {
    const response = await apiClient.post(`/trips/${tripId}/participants/invite`, data);
    return response.data;
  },

  // Alias for preferences (some pages expect it on tripsAPI)
  createPreference: async (tripId: string, data: PreferenceCreate): Promise<Preference> => {
    const response = await apiClient.post(`/trips/${tripId}/preferences`, data);
    return response.data;
  },
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: async (tripId: string): Promise<Recommendation[]> => {
    const response = await apiClient.get(`/trips/${tripId}/recommendations`);
    return response.data;
  },

  getRecommendation: async (tripId: string, recId: string): Promise<Recommendation> => {
    const response = await apiClient.get(`/trips/${tripId}/recommendations/${recId}`);
    return response.data;
  },

  generateRecommendations: async (tripId: string) => {
    const response = await apiClient.post(`/trips/${tripId}/recommendations/generate`);
    return response.data;
  },

  createRecommendation: async (tripId: string, data: RecommendationCreate): Promise<Recommendation> => {
    const response = await apiClient.post(`/trips/${tripId}/recommendations`, data);
    return response.data;
  },

  deleteRecommendation: async (tripId: string, recId: string): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/recommendations/${recId}`);
  },
};

// Votes API
export const votesAPI = {
  getVotes: async (tripId: string): Promise<Vote[]> => {
    const response = await apiClient.get(`/trips/${tripId}/votes`);
    return response.data;
  },

  castVotes: async (tripId: string, data: { votes: Array<{ recommendation_id: string; rank: number }> }): Promise<Vote[]> => {
    const response = await apiClient.post(`/trips/${tripId}/votes`, data);
    return response.data;
  },

  getMyVotes: async (tripId: string): Promise<Vote[]> => {
    const response = await apiClient.get(`/trips/${tripId}/votes/my-votes`);
    return response.data;
  },

  getResults: async (tripId: string): Promise<VotingResult> => {
    const response = await apiClient.get(`/trips/${tripId}/votes/results`);
    return response.data;
  },

  getVotingSummary: async (tripId: string): Promise<UserVoteSummary[]> => {
    const response = await apiClient.get(`/trips/${tripId}/votes/summary`);
    return response.data;
  },

  withdrawVotes: async (tripId: string): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/votes`);
  },

  // Alias for compatibility with existing code
  getUserVote: async (tripId: string): Promise<Vote[]> => {
    return votesAPI.getMyVotes(tripId);
  },
};

// Preferences API
export const preferencesAPI = {
  getPreferences: async (tripId: string): Promise<Preference[]> => {
    const response = await apiClient.get(`/trips/${tripId}/preferences`);
    return response.data;
  },

  createPreference: async (tripId: string, data: PreferenceCreate): Promise<Preference> => {
    const response = await apiClient.post(`/trips/${tripId}/preferences`, data);
    return response.data;
  },

  updatePreference: async (tripId: string, prefId: string, data: PreferenceUpdate): Promise<Preference> => {
    const response = await apiClient.put(`/trips/${tripId}/preferences/${prefId}`, data);
    return response.data;
  },

  getSurvey: async (tripId: string): Promise<SurveyResponse> => {
    const response = await apiClient.get(`/trips/${tripId}/preferences/survey`);
    return response.data;
  },

  submitSurvey: async (tripId: string, data: SurveySubmit): Promise<SurveyResponse> => {
    const response = await apiClient.post(`/trips/${tripId}/preferences/survey`, data);
    return response.data;
  },
};

// Telegram API
export const telegramAPI = {
  sendSurveyInvitation: async (tripId: string) => {
    const response = await apiClient.post('/telegram/send-survey-invitation', { trip_id: tripId });
    return response.data;
  },

  sendVotingNotification: async (tripId: string) => {
    const response = await apiClient.post('/telegram/send-voting-notification', { trip_id: tripId });
    return response.data;
  },

  getParticipantsStats: async (tripId: string) => {
    const response = await apiClient.get(`/telegram/participants-stats/${tripId}`);
    return response.data;
  },

  getBotInfo: async () => {
    const response = await apiClient.get('/telegram/bot-info');
    return response.data;
  },
};

export default apiClient;
