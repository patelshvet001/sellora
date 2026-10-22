import { defineStore } from 'pinia';

type Role = 'CUSTOMER' | 'VENDOR' | 'SERVICE_PROVIDER' | 'DELIVERY_PARTNER' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isVerified?: boolean;
  [key: string]: any;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    pendingEmail: '' as string,
    loading: false,
    error: '' as string,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userInitials: (state) => {
      const name = state.user?.name || '';
      if (!name) return 'U';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
      return (first + last).toUpperCase() || 'U';
    },
    avatarSrc: (state) => {
      if (state.user?.avatarUrl) {
        if (state.user.avatarUrl.startsWith('http')) return state.user.avatarUrl;
        // For relative URLs, return null so components use getAvatarSrc() method instead
        return null;
      }
      return null;
    },
  },

  actions: {
    /** Get full avatar URL. Use this in component setup/script context where runtime config is available */
    getAvatarSrc(): string | null {
      if (!this.user?.avatarUrl) return null;
      if (this.user.avatarUrl.startsWith('http')) return this.user.avatarUrl;
      const config = useRuntimeConfig();
      return `${config.public.apiBase.replace('/api', '')}${this.user.avatarUrl}`;
    },

    async register(payload: Record<string, any>) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ email: string }>('/auth/register', {
          method: 'POST',
          body: payload,
        });
        this.pendingEmail = res.email;
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async verifyOtp(otp: string) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ token: string; user: AuthUser }>('/auth/verify-otp', {
          method: 'POST',
          body: { email: this.pendingEmail, otp },
        });
        this.setSession(res.token, res.user);
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async requestPasswordReset(email: string) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        await request('/auth/forgot-password', { method: 'POST', body: { email } });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(payload: { email: string; token: string; newPassword: string; confirmPassword: string }) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        await request('/auth/reset-password', { method: 'POST', body: payload });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async resendOtp() {
      this.error = '';
      const { request } = useApi();
      try {
        await request('/auth/resend-otp', { method: 'POST', body: { email: this.pendingEmail } });
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      }
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ token: string; user: AuthUser }>('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        this.setSession(res.token, res.user);
        return true;
      } catch (err: any) {
        if (err.message === 'Account not verified') {
          this.pendingEmail = email;
        }
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchMe() {
      const token = useCookie('sellora_token').value;
      if (!token) return;

      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ user: AuthUser }>('/auth/me', { auth: true });
        this.user = res.user;
      } catch (err: any) {
        const tokenCookie = useCookie('sellora_token');
        tokenCookie.value = null;
        this.user = null;
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchFullProfile() {
      const { request } = useApi();
      try {
        const res = await request<{ user: AuthUser }>('/users/me', { auth: true });
        this.user = res.user;
        return res.user;
      } catch (err: any) {
        this.error = err.message;
        return null;
      }
    },

    async updateProfile(data: { name?: string; phone?: string }) {
      this.loading = true;
      this.error = '';
      const { request } = useApi();
      try {
        const res = await request<{ user: AuthUser }>('/users/me', {
          method: 'PATCH',
          body: data,
          auth: true,
        });
        if (this.user) {
          // Direct mutation preserves Pinia reactivity chain
          Object.assign(this.user, res.user);
        }
        return true;
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async uploadAvatar(file: File) {
      this.loading = true;
      this.error = '';
      const token = useCookie('sellora_token').value;
      const config = useRuntimeConfig();

      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await $fetch<{ user: AuthUser }>(`${config.public.apiBase}/users/me/avatar`, {
          method: 'POST',
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (this.user) {
          // Direct mutation preserves Pinia reactivity chain
          this.user.avatarUrl = res.user.avatarUrl;
        }
        return true;
      } catch (err: any) {
        const message = err?.data?.error || err?.data?.message || err?.message || 'Upload failed';
        this.error = message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    setSession(token: string, user: AuthUser) {
      const tokenCookie = useCookie('sellora_token', {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      tokenCookie.value = token;
      this.user = user;
    },

    logout() {
      const tokenCookie = useCookie('sellora_token', { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      tokenCookie.value = null;
      this.user = null;
      navigateTo('/auth/login');
    },

    dashboardPath(): string {
      switch (this.user?.role) {
        case 'VENDOR':
          return '/vendor/dashboard';
        case 'DELIVERY_PARTNER':
          return '/delivery/dashboard';
        case 'SERVICE_PROVIDER':
          return '/provider/dashboard';
        case 'ADMIN':
          return '/admin/dashboard';
        default:
          return '/dashboard/';
      }
    },
  },
});

