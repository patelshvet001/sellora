// Usage: definePageMeta({ middleware: ['auth', 'role'], roles: ['VENDOR'] })
// Always pair with the `auth` middleware (listed first) so authStore.user is populated.
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const allowedRoles = (to.meta.roles as string[] | undefined) || [];

  if (allowedRoles.length && !allowedRoles.includes(authStore.user?.role || '')) {
    // Send them to the dashboard that actually matches their role instead of a dead end
    return navigateTo(authStore.dashboardPath());
  }
});
