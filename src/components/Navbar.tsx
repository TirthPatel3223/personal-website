'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useChatPanel } from './ChatProvider';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('');
  const { theme, toggle } = useTheme();
  const { open: openChat } = useChatPanel();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const navHref = (anchor: string) => (isHome ? anchor : `/${anchor}`);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      const sections = NAV_LINKS.map((l) => l.href.slice(1));
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(`#${id}`);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    /* Outer wrapper: fixed, full-width, pointer-events-none so gaps are click-through */
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.header
        animate={{
          maxWidth: scrolled ? '1000px' : '1180px',
          marginTop: scrolled ? '16px' : '0px',
          borderRadius: scrolled ? '999px' : '0px',
          height: scrolled ? '56px' : '80px',
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`pointer-events-auto w-full ${scrolled ? 'glass' : 'bg-transparent'}`}
        style={{ overflow: scrolled ? 'visible' : 'hidden' }}
      >
        <nav className="flex items-center justify-between px-6 h-full">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
          >
            T
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href} className="relative">
                <Link
                  href={navHref(href)}
                  className="text-sm font-medium tracking-wide transition-colors duration-200 py-1"
                  style={{
                    color: active === href ? 'var(--accent)' : 'var(--muted)',
                  }}
                  onMouseEnter={(e) => { if (active !== href) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { if (active !== href) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
                >
                  {label}
                  {active === href && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}

            {/* Chat opener - last item, after Contact */}
            <li>
              <button
                type="button"
                onClick={openChat}
                className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium tracking-wide rounded-full px-3.5 py-1.5 transition-colors duration-200"
                style={{
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-dim)',
                  border: '1px solid var(--glass-border)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-dim-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; }}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Ask me about Tirth
              </button>
            </li>
          </ul>

          {/* Right: theme toggle + hamburger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ color: 'var(--muted)' }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    <Sun className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    <Moon className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              className="md:hidden p-2 rounded-full transition-colors duration-200"
              style={{ color: 'var(--muted)' }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block"
                  >
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block"
                  >
                    <Menu className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile dropdown — rendered outside the pill so it can overflow */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto absolute top-[84px] right-4 glass rounded-2xl min-w-[180px] overflow-hidden"
          >
            <ul className="p-3 space-y-1">
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.li
                  key={href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={navHref(href)}
                    className="block text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200"
                    style={{
                      color: active === href ? 'var(--accent)' : 'var(--foreground)',
                      backgroundColor: active === href ? 'var(--accent-dim)' : 'transparent',
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.04, duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openChat(); }}
                  className="w-full flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200"
                  style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  Ask me about Tirth
                </button>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
