'use client';

import { Bloom, EffectComposer, TiltShift2, Vignette } from '@react-three/postprocessing';
import type { ScenePalette } from './palette';

/* High tier only. Bloom reads HDR values above 1.0, which only the glow material
   produces, so a bright daytime sky never blooms. TiltShift2 blurs the top and bottom
   of the frame into the "miniature diorama" look; exhibits that need crisp detail
   everywhere turn it off. */
export default function Effects({ palette, tiltShift = true }: { palette: ScenePalette; tiltShift?: boolean }) {
  const dark = palette.mode === 'dark';
  if (tiltShift) {
    return (
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={dark ? 0.85 : 0.4} radius={0.6} />
        <TiltShift2 blur={0.085} taper={0.65} start={[0, 0.46]} end={[1, 0.46]} samples={8} />
        <Vignette offset={0.3} darkness={dark ? 0.55 : 0.2} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={dark ? 1 : 0.4} radius={0.7} />
      <Vignette offset={0.3} darkness={dark ? 0.45 : 0.18} />
    </EffectComposer>
  );
}
