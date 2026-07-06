'use client';

import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Live Demo', href: '#demo' },
  { label: 'AI Agents', href: '#agents' },
  { label: 'Sensors', href: '#sensors' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Predictions', href: '#predict' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-[20px] backdrop-saturate-[180%] border-b transition-all duration-300 ${
        scrolled
          ? 'bg-sp-bg-1/90 border-white/[0.12]'
          : 'bg-sp-bg-1/80 border-white/[0.05]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 font-extrabold text-xl text-sp-text-1 no-underline">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <rect x="2" y="6" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 10v12M10 16h12" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3" fill="#00e5a0" opacity="0.3" />
          </svg>
          SmartPark
        </a>

        {/* Links */}
        <ul className="hidden md:flex gap-8 list-none">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="text-sp-text-2 no-underline text-sm font-medium hover:text-sp-cyan transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Badge */}
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-sp-cyan/15 text-sp-cyan border border-sp-cyan/20">
          EdgeAgent 2026
        </span>
      </div>
    </nav>
  );
}
