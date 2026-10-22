export function useAdminNav() {
  const navItems = [
    { to: '/admin/dashboard', label: 'Overview', icon: '📊' },
    { to: '/admin/vendors', label: 'Vendors', icon: '🏪' },
    { to: '/admin/providers', label: 'Service Providers', icon: '🧰' },
    { to: '/admin/delivery-partners', label: 'Delivery Partners', icon: '🛵' },
    { to: '/admin/users', label: 'Customers', icon: '👥' },
    { to: '/admin/orders', label: 'Orders', icon: '📦' },
  ];

  return { navItems };
}
