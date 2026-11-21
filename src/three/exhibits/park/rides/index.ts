import type { ScenePalette } from '../../../core/palette';
import { carousel, cottage, flyers, playground, rockets, teacups, treehouse } from './flat';
import { storybook, scifi, theater, tiki, toon } from './buildings';
import { alpine, boathouse, dome, flume, hangar, minetrain, temple } from './hero';
import { newCtx, type RideCtx } from './kit';
import { autopia, circus, monorail, trolley, woodie } from './tracks';
import { canal, canoes, facade, fort, jungle, ship, subs } from './water';

/* Ride model by layout variant (scripts/3d/build-park-layout.py picks the variant
   from the ride's name and sets its footprint radius). */
const RIDES: Record<string, (c: RideCtx) => void> = {
  flume,
  alpine,
  boathouse,
  minetrain,
  dome,
  hangar,
  temple,
  woodie,
  canoes,
  facade,
  jungle,
  ship,
  canal,
  subs,
  autopia,
  monorail,
  circus,
  trolley,
  rockets,
  flyers,
  carousel,
  teacups,
  treehouse,
  fort,
  cottage,
  playground,
  tiki,
  theater,
  scifi,
  toon,
  storybook,
};

export function buildRide(variant: string, p: ScenePalette, seed: number, r: number): RideCtx {
  const c = newCtx(p, seed, r);
  (RIDES[variant] ?? storybook)(c);
  return c;
}
