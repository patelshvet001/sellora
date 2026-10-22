import { defineStore } from 'pinia';

export const useBookingsStore = defineStore('bookings', {
  state: () => ({
    bookings: [] as any[],
    loading: false,
    error: '',
  }),

  actions: {
    async createBooking(payload: {
      serviceId: number;
      scheduledAt: string;
      address: string;
      city: string;
      pincode: string;
      notes?: string;
    }) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ booking: any }>('/bookings', { method: 'POST', body: payload, auth: true });
        return res.booking;
      } catch (err: any) {
        this.error = err.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchMyBookings() {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ bookings: any[] }>('/bookings/mine', { auth: true });
        this.bookings = res.bookings;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
