import { defineStore } from 'pinia';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null as any,
    users: [] as any[],
    vendors: [] as any[],
    providers: [] as any[],
    deliveryPartners: [] as any[],
    orders: [] as any[],
    currentUser: null as any,
    loading: false,
    error: '',
  }),

  actions: {
    async fetchStats() {
      const { request } = useApi();
      try {
        const res = await request<{ stats: any }>('/admin/stats', { auth: true });
        this.stats = res.stats;
      } catch (err: any) {
        this.error = err.message;
      }
    },

    async fetchUsers(role?: string) {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ users: any[] }>(`/admin/users${role ? `?role=${role}` : ''}`, { auth: true });
        this.users = res.users;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchUser(id: number | string) {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ user: any }>(`/admin/users/${id}`, { auth: true });
        this.currentUser = res.user;
        return res.user;
      } catch (err: any) {
        this.error = err.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateUser(id: number | string, payload: Record<string, any>) {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ user: any }>(`/admin/users/${id}`, { method: 'PATCH', body: payload, auth: true });
        this.currentUser = res.user;
        const u = this.users.find((x) => x.id === Number(id));
        if (u) Object.assign(u, res.user);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async setUserActive(id: number, isActive: boolean) {
      const { request } = useApi();
      try {
        await request(`/admin/users/${id}/status`, { method: 'PATCH', body: { isActive }, auth: true });
        const u = this.users.find((x) => x.id === id);
        if (u) u.isActive = isActive;
        if (this.currentUser && this.currentUser.id === id) this.currentUser.isActive = isActive;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async fetchVendors() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ vendors: any[] }>('/admin/vendors', { auth: true });
        this.vendors = res.vendors;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async approveVendor(id: number, isApproved: boolean) {
      const { request } = useApi();
      try {
        await request(`/admin/vendors/${id}/approve`, { method: 'PATCH', body: { isApproved }, auth: true });
        const v = this.vendors.find((x) => x.id === id);
        if (v) v.isApproved = isApproved;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async fetchProviders() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ providers: any[] }>('/admin/providers', { auth: true });
        this.providers = res.providers;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async approveProvider(id: number, isApproved: boolean) {
      const { request } = useApi();
      try {
        await request(`/admin/providers/${id}/approve`, { method: 'PATCH', body: { isApproved }, auth: true });
        const p = this.providers.find((x) => x.id === id);
        if (p) p.isApproved = isApproved;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async fetchDeliveryPartners() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ partners: any[] }>('/admin/delivery-partners', { auth: true });
        this.deliveryPartners = res.partners;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async approveDeliveryPartner(id: number, isApproved: boolean) {
      const { request } = useApi();
      try {
        await request(`/admin/delivery-partners/${id}/approve`, { method: 'PATCH', body: { isApproved }, auth: true });
        const p = this.deliveryPartners.find((x) => x.id === id);
        if (p) p.isApproved = isApproved;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async fetchOrders() {
      this.loading = true;
      const { request } = useApi();
      try {
        const res = await request<{ orders: any[] }>('/admin/orders', { auth: true });
        this.orders = res.orders;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
