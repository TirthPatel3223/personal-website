'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from './ThemeProvider';

const DynamicCubeScene = dynamic(() => import('./MalteseCubeScene'), { ssr: false });

interface ScrollCubeWrapperProps {
  children: React.ReactNode;
}

export default function ScrollCubeWrapper({ children }: ScrollCubeWrapperProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme } = useTheme();

  const bgGradient = theme === 'dark'
    ? 'radial-gradient(ellipse at 60% 45%, #0d1520 0%, #050810 60%, #000000 100%)'
    : 'radial-gradient(ellipse at 60% 45%, #dce8f5 0%, #eef4fb 60%, #f8fbff 100%)';

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      {/* Fixed background canvas */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bgGradient,
            zIndex: -1,
          }}
        />
        <DynamicCubeScene scrollProgress={scrollProgress} />
      </div>

      {/* Page content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
