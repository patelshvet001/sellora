export function useVendorNav() {
  const navItems = [
    { to: '/vendor/dashboard', label: 'Overview', icon: '📊' },
    { to: '/vendor/products', label: 'Products', icon: '🛍️' },
    { to: '/vendor/orders', label: 'Orders', icon: '📦' },
  ];

  return { navItems };
}
