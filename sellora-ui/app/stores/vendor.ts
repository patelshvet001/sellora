import { defineStore } from 'pinia';

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    stats: null as any,
    products: [] as any[],
    categories: [] as any[],
    orders: [] as any[],
    loading: false,
    loadingCategories: false,
    error: '',
  }),

  actions: {
    async fetchStats() {
      const { request } = useApi();
      try {
        const res = await request<{ stats: any }>('/vendor/stats', { auth: true });
        this.stats = res.stats;
      } catch (err: any) {
        this.error = err.message;
      }
    },

    // ---------- Categories ----------

    async fetchCategories() {
      this.loadingCategories = true;
      const { request } = useApi();
      try {
        const res = await request<{ categories: any[] }>('/categories');
        this.categories = res.categories;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loadingCategories = false;
      }
    },

    async createCategory(payload: { name: string; slug: string; iconUrl?: string }) {
      const { request } = useApi();
      try {
        const res = await request<{ category: any }>('/categories', {
          method: 'POST',
          body: payload,
          auth: true,
        });
        this.categories.push(res.category);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async deleteCategory(id: number) {
      const { request } = useApi();
      try {
        await request(`/categories/${id}`, { method: 'DELETE', auth: true });
        this.categories = this.categories.filter((c) => c.id !== id);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    // ---------- Products ----------

    async fetchProducts() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ products: any[] }>('/vendor/products', { auth: true });
        this.products = res.products;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createProduct(payload: Record<string, any>) {
      const { request } = useApi();
      try {
        await request('/products', { method: 'POST', body: payload, auth: true });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async updateProduct(id: number, payload: Record<string, any>) {
      const { request } = useApi();
      try {
        await request(`/products/${id}`, { method: 'PATCH', body: payload, auth: true });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async deleteProduct(id: number) {
      const { request } = useApi();
      try {
        await request(`/products/${id}`, { method: 'DELETE', auth: true });
        this.products = this.products.filter((p) => p.id !== id);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    // ---------- Orders ----------

    async fetchOrders() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ orders: any[] }>('/vendor/orders', { auth: true });
        this.orders = res.orders;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateOrderStatus(orderId: number, status: string) {
      const { request } = useApi();
      try {
        await request(`/orders/${orderId}/status`, { method: 'PATCH', body: { status }, auth: true });
        const order = this.orders.find((o) => o.id === orderId);
        if (order) order.status = status;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },
  },
});
