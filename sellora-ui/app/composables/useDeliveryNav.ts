export function useDeliveryNav() {
  const navItems = [
    { to: '/delivery/dashboard', label: 'Available orders', icon: '📍' },
    { to: '/delivery/orders', label: 'My deliveries', icon: '🛵' },
  ];

  return { navItems };
}
