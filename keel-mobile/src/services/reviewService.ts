// keel-mobile/src/services/reviewService.ts
import api from './api';

export const reviewService = {
  /**
   * Fetches all monthly reviews for the logged-in cadet.
   */
  getMyReviews: async (userId: number) => {
    try {
      const response = await api.get(`/reviews/cadet/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      throw error;
    }
  }
};