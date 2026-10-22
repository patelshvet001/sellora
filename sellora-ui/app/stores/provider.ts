import { defineStore } from 'pinia';

export const useProviderStore = defineStore('provider', {
  state: () => ({
    stats: null as any,
    services: [] as any[],
    bookings: [] as any[],
    loading: false,
    error: '',
  }),

  actions: {
    async fetchStats() {
      const { request } = useApi();
      try {
        const res = await request<{ stats: any }>('/provider/stats', { auth: true });
        this.stats = res.stats;
      } catch (err: any) {
        this.error = err.message;
      }
    },

    async fetchServices() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ services: any[] }>('/provider/services', { auth: true });
        this.services = res.services;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createService(payload: Record<string, any>) {
      const { request } = useApi();
      try {
        await request('/services', { method: 'POST', body: payload, auth: true });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async updateService(id: number, payload: Record<string, any>) {
      const { request } = useApi();
      try {
        await request(`/provider/services/${id}`, { method: 'PATCH', body: payload, auth: true });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async deleteService(id: number) {
      const { request } = useApi();
      try {
        await request(`/provider/services/${id}`, { method: 'DELETE', auth: true });
        this.services = this.services.filter((s) => s.id !== id);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async fetchBookings() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ bookings: any[] }>('/provider/bookings', { auth: true });
        this.bookings = res.bookings;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateBookingStatus(id: number, status: string) {
      const { request } = useApi();
      try {
        await request(`/bookings/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
        const b = this.bookings.find((x) => x.id === id);
        if (b) b.status = status;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },
  },
});
