'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NUM_BLOBS = 5;

interface Blob {
  id: number;
  size: string;
  top: string;
  left: string;
  duration: number;
  delay: number;
  xParams: string[];
  yParams: string[];
  scaleParams: number[];
  opacityParams: number[];
}

export default function AnimatedBackground() {
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const newBlobs: Blob[] = Array.from({ length: NUM_BLOBS }).map((_, i) => {
      const size = Math.floor(Math.random() * 40) + 30;
      const startX = Math.floor(Math.random() * 100);
      const startY = Math.floor(Math.random() * 100);
      const xKeyframes = Array.from({ length: 5 }).map(
        () => `${Math.floor(Math.random() * 80) - 40}vw`
      );
      const yKeyframes = Array.from({ length: 5 }).map(
        () => `${Math.floor(Math.random() * 80) - 40}vh`
      );
      xKeyframes.push(xKeyframes[0]);
      yKeyframes.push(yKeyframes[0]);
      return {
        id: i,
        size: `${size}vw`,
        top: `${startY}%`,
        left: `${startX}%`,
        duration: 7 + Math.random() * 10,
        delay: Math.random() * 5,
        xParams: xKeyframes,
        yParams: yKeyframes,
        scaleParams: [1, 1.2, 0.8, 1.1, 1],
        opacityParams: [0.4, 0.7, 0.3, 0.6, 0.4],
      };
    });
    setBlobs(newBlobs);
  }, []);

  return (
    <div
      className="animated-bg"
      aria-hidden="true"
    >
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="blob dynamic-blob"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            marginTop: `-${parseFloat(blob.size) / 2}vw`,
            marginLeft: `-${parseFloat(blob.size) / 2}vw`,
          }}
          animate={{
            scale: blob.scaleParams,
            opacity: blob.opacityParams,
            x: blob.xParams,
            y: blob.yParams,
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: blob.delay,
          }}
        />
      ))}

      <motion.div
        className="cursor-blob"
        style={{
          left: mousePos.x - 80,
          top: mousePos.y - 80,
        }}
        animate={{ scale: [0.9, 1.05, 0.95] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
