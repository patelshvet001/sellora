// Usage: definePageMeta({ middleware: 'guest' }) on login/register/forgot-password/etc.
// so an already-authenticated user gets bounced to their dashboard instead of
// seeing the login form again.
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();
  const token = useCookie('sellora_token').value;

  if (token && !authStore.isLoggedIn) {
    await authStore.fetchMe();
  }

  if (authStore.isLoggedIn) {
    return navigateTo(authStore.dashboardPath());
  }
});
