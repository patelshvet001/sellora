import { defineStore } from 'pinia';

export interface Address {
  id: number;
  userId: number;
  label: 'HOME' | 'WORK' | 'OTHER';
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
  createdAt: string;
}

export const useAddressStore = defineStore('address', {
  state: () => ({
    addresses: [] as Address[],
    loading: false,
    error: '',
  }),

  actions: {
    async fetchAddresses() {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ addresses: Address[] }>('/addresses', { auth: true });
        this.addresses = res.addresses;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async createAddress(data: {
      label: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      isDefault?: boolean;
    }) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ address: Address }>('/addresses', {
          method: 'POST',
          body: data,
          auth: true,
        });
        this.addresses.unshift(res.address);
        // If new address is default, demote others
        if (res.address.isDefault) {
          this.addresses.forEach(a => {
            if (a.id !== res.address.id) a.isDefault = false;
          });
        }
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async updateAddress(id: number, data: Partial<{
      label: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      isDefault: boolean;
    }>) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ address: Address }>(`/addresses/${id}`, {
          method: 'PATCH',
          body: data,
          auth: true,
        });
        const idx = this.addresses.findIndex(a => a.id === id);
        if (idx !== -1) {
          this.addresses[idx] = res.address;
        }
        // If updated address is default, demote others
        if (res.address.isDefault) {
          this.addresses.forEach(a => {
            if (a.id !== id) a.isDefault = false;
          });
        }
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async deleteAddress(id: number) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        await request(`/addresses/${id}`, {
          method: 'DELETE',
          auth: true,
        });
        this.addresses = this.addresses.filter(a => a.id !== id);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    labelIcon(label: string): string {
      switch (label) {
        case 'HOME': return '🏠';
        case 'WORK': return '💼';
        case 'OTHER': return '📍';
        default: return '📍';
      }
    },
  },
});

