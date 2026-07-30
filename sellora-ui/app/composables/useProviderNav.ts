export function useProviderNav() {
  const navItems = [
    { to: '/provider/dashboard', label: 'Overview', icon: '📊' },
    { to: '/provider/services', label: 'Services', icon: '🧰' },
    { to: '/provider/bookings', label: 'Bookings', icon: '📅' },
  ];

  return { navItems };
}
