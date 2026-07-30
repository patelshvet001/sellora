export function useApi() {
  const config = useRuntimeConfig();

  async function request<T>(
    path: string,
    options: { method?: string; body?: any; auth?: boolean } = {}
  ): Promise<T> {
    const token = useCookie('sellora_token').value;

    try {
      return await $fetch<T>(`${config.public.apiBase}${path}`, {
        method: (options.method as any) || 'GET',
        body: options.body,
        headers: options.auth && token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err: any) {
      // Normalize Nuxt/$fetch errors into a plain message string
      const message =
        err?.data?.error || err?.data?.message || err?.message || 'Something went wrong';
      throw new Error(message);
    }
  }

  return { request };
}
