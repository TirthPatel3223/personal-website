'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicCubeScene = dynamic(() => import('./MalteseCubeScene'), { ssr: false });

interface ScrollCubeWrapperProps {
  children: React.ReactNode;
}

export default function ScrollCubeWrapper({ children }: ScrollCubeWrapperProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

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
            background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #000000 100%)',
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
