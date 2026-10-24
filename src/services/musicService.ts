import { api } from '../api/axiosConfig';

export interface MusicTrack {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  lyrics?: string;
  categoryId: string | { _id: string; title: string };
  duration?: number;
  order?: number;
  playsCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface MusicCategory {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  coverUrl?: string;
  order?: number;
  isActive?: boolean;
  tracks?: MusicTrack[];
}

export interface PaginatedTracksResponse {
  tracks: MusicTrack[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Resolves a media URL to a full accessible URL.
 * If it's a relative path starting with '/', prepends the API host (without '/api').
 */
export const resolveMediaUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Derive host from api.defaults.baseURL
  const base = api.defaults.baseURL || 'http://192.168.1.128:5001/api';
  const origin = base.replace(/\/api\/?$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanUrl}`;
};

export const musicService = {
  /**
   * Get all active categories with their top 10 tracks
   */
  async getCategoriesWithTracks(): Promise<MusicCategory[]> {
    try {
      const response = await api.get<{ success: boolean; data: MusicCategory[] }>(
        '/public/music/categories'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching music categories with tracks:', error);
      throw error;
    }
  },

  /**
   * Get paginated tracks for a category with optional search
   */
  async getCategoryTracks(
    categoryId: string,
    page = 1,
    limit = 20,
    search = ''
  ): Promise<PaginatedTracksResponse> {
    try {
      const params: Record<string, any> = { page, limit };
      if (search.trim()) {
        params.q = search.trim();
      }
      const response = await api.get<{
        success: boolean;
        data: PaginatedTracksResponse;
      }>(`/public/music/categories/${categoryId}/tracks`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching tracks for category ${categoryId}:`, error);
      throw error;
    }
  },

  /**
   * Get single track details (and increment play counter)
   */
  async getTrackDetails(trackId: string): Promise<MusicTrack> {
    try {
      const response = await api.get<{ success: boolean; data: MusicTrack }>(
        `/public/music/tracks/${trackId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching track details for ${trackId}:`, error);
      throw error;
    }
  },

  /**
   * Search across all tracks
   */
  async searchTracks(query: string, limit = 20): Promise<MusicTrack[]> {
    try {
      if (!query.trim()) return [];
      const response = await api.get<{ success: boolean; data: MusicTrack[] }>(
        '/public/music/search',
        { params: { q: query.trim(), limit } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching music tracks:', error);
      throw error;
    }
  },
};
