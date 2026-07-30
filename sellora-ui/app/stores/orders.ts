import { defineStore } from 'pinia';

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [] as any[],
    current: null as any,
    loading: false,
    error: '',
  }),

  actions: {
    async checkout(payload: {
      addressId: number;
      items: { productId: number; quantity: number }[];
      paymentMethod?: string;
      notes?: string;
      couponCode?: string;
    }) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ order: any }>('/orders', { method: 'POST', body: payload, auth: true });
        return res.order;
      } catch (err: any) {
        this.error = err.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchMyOrders() {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ orders: any[] }>('/orders/mine', { auth: true });
        this.orders = res.orders;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchOrder(id: number | string) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ order: any }>(`/orders/${id}`, { auth: true });
        this.current = res.order;
        return res.order;
      } catch (err: any) {
        this.error = err.message;
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});
