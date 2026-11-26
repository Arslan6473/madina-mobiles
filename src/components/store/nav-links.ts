export type NavCategory = { name: string; slug: string; icon?: string };

export const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/shop?sort=popular", label: "Best Sellers" },
  { href: "/track-order", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];
