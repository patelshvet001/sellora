import { defineStore } from 'pinia';

export const useDeliveryStore = defineStore('delivery', {
  state: () => ({
    stats: null as any,
    available: [] as any[],
    mine: [] as any[],
    loading: false,
    error: '',
  }),

  actions: {
    async fetchStats() {
      const { request } = useApi();
      try {
        const res = await request<{ stats: any }>('/delivery/stats', { auth: true });
        this.stats = res.stats;
      } catch (err: any) {
        this.error = err.message;
      }
    },

    async fetchAvailable() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ orders: any[] }>('/delivery/orders/available', { auth: true });
        this.available = res.orders;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchMine() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ orders: any[] }>('/delivery/orders/mine', { auth: true });
        this.mine = res.orders;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async accept(orderId: number) {
      this.error = '';
      const { request } = useApi();
      try {
        await request(`/delivery/orders/${orderId}/accept`, { method: 'POST', auth: true });
        this.available = this.available.filter((o) => o.id !== orderId);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async updateStatus(orderId: number, status: string) {
      this.error = '';
      const { request } = useApi();
      try {
        await request(`/orders/${orderId}/status`, { method: 'PATCH', body: { status }, auth: true });
        const o = this.mine.find((x) => x.id === orderId);
        if (o) o.status = status;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },
  },
});
