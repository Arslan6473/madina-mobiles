import {
  BatteryCharging,
  Cable,
  Earbuds,
  Headphones,
  Headset,
  MemoryStick,
  Package,
  PlugZap,
  ShieldCheck,
  Smartphone,
  Speaker,
  TabletSmartphone,
  Watch,
  type LucideIcon,
} from "lucide-react";

/** Lucide icon names that categories may use (admin picks one of these). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  earbuds: Earbuds,
  headphones: Headphones,
  "plug-zap": PlugZap,
  cable: Cable,
  "battery-charging": BatteryCharging,
  "memory-stick": MemoryStick,
  smartphone: Smartphone,
  "shield-check": ShieldCheck,
  headset: Headset,
  speaker: Speaker,
  watch: Watch,
  "tablet-smartphone": TabletSmartphone,
  package: Package,
};

export function CategoryIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && CATEGORY_ICONS[name]) || Package;
  return <Icon className={className} aria-hidden />;
}

type SvgProps = { className?: string };

/** Brand marks (lucide ships no brand logos). */
export function WhatsAppIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37A9.86 9.86 0 0 1 2.16 12C2.17 6.55 6.6 2.12 12.06 2.12c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41" />
    </svg>
  );
}

export function FacebookIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
    </svg>
  );
}

export function InstagramIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.04.86.13v-3.5a6.37 6.37 0 0 0-.86-.06A6.33 6.33 0 0 0 3.15 15.7a6.34 6.34 0 0 0 10.86 4.43 6.3 6.3 0 0 0 1.81-4.43V8.73a8.2 8.2 0 0 0 4.77 1.52V6.81a4.8 4.8 0 0 1-1-.12" />
    </svg>
  );
}

export function YouTubeIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.6V8.4l6.2 3.6z" />
    </svg>
  );
}
