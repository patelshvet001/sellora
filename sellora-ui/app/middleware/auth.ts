// Usage: definePageMeta({ middleware: 'auth' }) on any page that requires a logged-in user.
// Apply this before `role` middleware if a page needs both.
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const token = useCookie('sellora_token').value;

  if (!token) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } });
  }

  // On a hard refresh / first navigation, app.vue's onMounted() hasn't run yet
  // so the store's user may still be null even though the cookie is valid.
  // Resolve that here rather than redirecting a genuinely logged-in user.
  if (!authStore.isLoggedIn) {
    await authStore.fetchMe();
  }

  if (!authStore.isLoggedIn) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } });
  }
});
