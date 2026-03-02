/**
 * exerciseImages.ts
 * Two-tier image system:
 *   1. EXERCISE_GIF_MAP  — animated GIFs from ExerciseDB CDN (primary, best quality)
 *   2. EXERCISE_WGER_MAP — static frames from wger.de (fallback for exercises without a GIF)
 *
 * Usage:
 *   getExerciseMedia(slug) → { type: 'gif', url } | { type: 'slideshow', frames } | null
 */

const CDN = 'https://static.exercisedb.dev/media/';

/** Primary: slug -> single animated GIF URL */
export const EXERCISE_GIF_MAP: Record<string, string> = {
  // ── Barbell compounds ──────────────────────────────────────────────────────
  'barbell-back-squat':               CDN + 'qXTaZnJ.gif',
  'conventional-deadlift':            CDN + 'ila4NZS.gif',
  'barbell-bench-press':              CDN + 'EIeI8Vf.gif',
  'barbell-overhead-press':           CDN + 'kTbSH9h.gif',
  'barbell-bent-over-row':            CDN + 'eZyBC3j.gif',
  'romanian-deadlift':                CDN + 'wQ2c4XD.gif',
  'barbell-hip-thrust':               CDN + 'Pjbc0Kt.gif',
  'barbell-curl':                     CDN + '25GPyDY.gif',
  'barbell-shrug':                    CDN + 'dG7tG5y.gif',
  'barbell-upright-row':              CDN + 'UDlhcO8.gif',
  'front-squat':                      CDN + 'zG0zs85.gif',
  'sumo-deadlift':                    CDN + 'KgI0tqW.gif',
  'good-morning':                     CDN + 'XlZ4lAC.gif',
  'rack-pull':                        CDN + 'za9Ni4z.gif',
  'close-grip-bench-press':           CDN + '7jGOBF3.gif',
  'incline-barbell-bench-press':      CDN + '3TZduzM.gif',
  'decline-barbell-bench-press':      CDN + 'GrO65fd.gif',
  'pendlay-row':                      CDN + 'r0z6xzQ.gif',
  'push-press':                       CDN + 'f7Y9eDZ.gif',
  'clean-and-press':                  CDN + 'SGY8Zui.gif',
  'box-squat':                        CDN + 'W9pFVv1.gif',
  'hack-squat':                       CDN + 'Qa55kX1.gif',
  'preacher-curl':                    CDN + 'qOgPVf6.gif',
  'reverse-curl':                     CDN + 'xNrS20v.gif',
  'stiff-leg-deadlift':               CDN + 'kuMiR2T.gif',
  'deadlift-rdl-dumbbell':            CDN + 'rR0LJzx.gif',

  // ── Dumbbell exercises ─────────────────────────────────────────────────────
  'dumbbell-shoulder-press':          CDN + 'znQUdHY.gif',
  'dumbbell-bicep-curl':              CDN + 'xiA6lRr.gif',
  'dumbbell-lunge':                   CDN + 'RRWFUcw.gif',
  'single-arm-dumbbell-row':          CDN + 'BJ0Hz5L.gif',
  'incline-dumbbell-press':           CDN + 'TVdivgY.gif',
  'incline-dumbbell-curl':            CDN + 'ae9UoXQ.gif',
  'incline-dumbbell-fly':             CDN + 'ESOd5Pl.gif',
  'dumbbell-lateral-raise':           CDN + 'DsgkuIt.gif',
  'dumbbell-front-raise':             CDN + '3eGE2JC.gif',
  'dumbbell-fly':                     CDN + 'yz9nUhF.gif',
  'dumbbell-reverse-fly':             CDN + 'EAs3xL9.gif',
  'dumbbell-shrug':                   CDN + 'NJzBsGJ.gif',
  'dumbbell-hip-thrust':              CDN + 'Pjbc0Kt.gif',
  'dumbbell-tate-press':              CDN + 's5PdDyY.gif',
  'decline-dumbbell-press':           CDN + '1qrWgZ2.gif',
  'hammer-curl':                      CDN + 'slDvUAU.gif',
  'concentration-curl':               CDN + 'kmVVAfu.gif',
  'goblet-squat':                     CDN + 'yn8yg1r.gif',
  'renegade-row':                     CDN + '7vG5o25.gif',
  'tricep-kickback':                  CDN + 'W6PxUkg.gif',
  'overhead-tricep-extension':        CDN + 'mpKZGWz.gif',
  'skull-crusher':                    CDN + 'iZop9xO.gif',
  'thruster-dumbbell':                CDN + 'W6PxUkg.gif',
  'devil-press':                      CDN + '0JtKWum.gif',
  'single-leg-deadlift':              CDN + 'gKozT8X.gif',
  'single-leg-calf-raise':            CDN + '1kB3Wmk.gif',
  'farmer-walk':                      CDN + 'qPEzJjA.gif',
  'ez-bar-curl':                      CDN + 'iaapw0g.gif',
  'spider-curl':                      CDN + '6sMAmNv.gif',
  'walking-lunge':                    CDN + 'IZVHb27.gif',
  'arnold-press':                     CDN + 'Xy4jlWA.gif',

  // ── Cable exercises ────────────────────────────────────────────────────────
  'cable-lat-pulldown':               CDN + 'RVwzP10.gif',
  'cable-tricep-pushdown':            CDN + 'gAwDzB3.gif',
  'cable-seated-row':                 CDN + 'fUBheHs.gif',
  'cable-lateral-raise':              CDN + 'goJ6ezq.gif',
  'cable-face-pull':                  CDN + 'zCgxPbV.gif',
  'cable-chest-fly':                  CDN + 'xLYSdtg.gif',
  'cable-crossover':                  CDN + '0CXGHya.gif',
  'cable-crunch':                     CDN + '8xUv4J7.gif',
  'cable-glute-kickback':             CDN + 'HEJ6DIX.gif',
  'cable-bicep-curl':                 CDN + 'QTXKWPh.gif',
  'cable-overhead-extension':         CDN + 'wDUqY2u.gif',
  'cable-reverse-fly':                CDN + 'PQcUlDi.gif',
  'cable-reverse-pushdown':           CDN + 'VjYliFZ.gif',
  'cable-shoulder-press':             CDN + 'PzQanLE.gif',
  'cable-leg-curl':                   CDN + 'Kpajagk.gif',
  'straight-arm-pulldown':            CDN + 'x69MAlq.gif',
  'reverse-grip-lat-pulldown':        CDN + 'ecpY0rH.gif',

  // ── Machine exercises ──────────────────────────────────────────────────────
  'machine-leg-press':                CDN + 'V07qpXy.gif',
  'leg-press-narrow-stance':          CDN + 'V07qpXy.gif',
  'leg-press-calf-raise':             CDN + 'AxFoqAD.gif',
  'leg-extension':                    CDN + 'my33uHU.gif',
  'lying-leg-curl':                   CDN + '17lJ1kr.gif',
  'seated-leg-curl':                  CDN + 'Zg3XY7P.gif',
  'machine-chest-press':              CDN + 'wDN97Ca.gif',
  'machine-row':                      CDN + 'aaXr7ld.gif',
  'machine-shoulder-press':           CDN + '67n3r98.gif',
  'pec-deck':                         CDN + 'v3xmPAR.gif',
  'seated-calf-raise':                CDN + 'ipvgBnC.gif',
  't-bar-row':                        CDN + 'aaXr7ld.gif',

  // ── Bodyweight ─────────────────────────────────────────────────────────────
  'pull-up':                          CDN + 'dG5Smob.gif',
  'chin-up':                          CDN + 'isAAZWA.gif',
  'neutral-grip-pull-up':             CDN + '0V2YQjW.gif',
  'push-up':                          CDN + 'Snj1wSv.gif',
  'diamond-push-up':                  CDN + 'soIB2rj.gif',
  'wide-grip-push-up':                CDN + 'JmMVpR3.gif',
  'archer-push-up':                   CDN + 'A9qxk2F.gif',
  'pike-push-up':                     CDN + 'sVvXT5J.gif',
  'chest-dip':                        CDN + '9WTm7dq.gif',
  'weighted-dip':                     CDN + 'MU9HnE7.gif',
  'ring-dip':                         CDN + 'ezTvXcr.gif',
  'plank':                            CDN + 'VBAWRPG.gif',
  'side-plank':                       CDN + 'wpbD28t.gif',
  'dead-bug':                         CDN + 'iny3m5y.gif',
  'hollow-body-hold':                 CDN + 'H6ETwO9.gif',
  'dragon-flag':                      CDN + 'pQ0Mx1Z.gif',
  'hanging-leg-raise':                CDN + 'I3tsCnC.gif',
  'crunch':                           CDN + 'BMMolZ3.gif',
  'bicycle-crunch':                   CDN + 'tZkGYZ9.gif',
  'decline-crunch':                   CDN + 'i5cEhka.gif',
  'russian-twist':                    CDN + '2jl9K55.gif',
  'v-up':                             CDN + 'H6ETwO9.gif',
  'inverted-row':                     CDN + 'bZGHsAZ.gif',
  'hyperextension':                   CDN + 'zhMwOwE.gif',
  'glute-bridge':                     CDN + 'qKBpF7I.gif',
  'single-leg-glute-bridge':          CDN + 'C5jncD2.gif',
  'donkey-kick':                      CDN + 'HEJ6DIX.gif',
  'mountain-climber':                 CDN + 'RJgzwny.gif',
  'burpee':                           CDN + 'dK9394r.gif',
  'jump-squat':                       CDN + 'LIlE5Tn.gif',
  'jump-lunge':                       CDN + 'PM1PZjg.gif',
  'box-jump':                         CDN + 'uZKq7lo.gif',
  'broad-jump':                       CDN + 'uZKq7lo.gif',
  'tuck-jump':                        CDN + 'uZKq7lo.gif',
  'jumping-jack':                     CDN + 'mr7pkqP.gif',
  'high-knee-run':                    CDN + 'oLrKqDH.gif',
  'bear-crawl':                       CDN + '0Yz8WdV.gif',
  'inchworm':                         CDN + 'ZgsNQ6d.gif',
  'wall-sit':                         CDN + 'sVQCCeG.gif',
  'pistol-squat':                     CDN + '5bpPTHv.gif',
  'sissy-squat':                      CDN + 'xdYPUtE.gif',
  'nordic-curl':                      CDN + 'GOJKFfO.gif',
  'glute-ham-raise':                  CDN + 'GOJKFfO.gif',
  'step-up':                          CDN + '5MRH8H2.gif',
  'cossack-squat':                    CDN + 'IMRsOCn.gif',
  'curtsy-lunge':                     CDN + 't8iSghb.gif',
  'lateral-squat':                    CDN + 'IMRsOCn.gif',
  'jump-rope':                        CDN + 'e1e76I2.gif',
  'ab-wheel-rollout':                 CDN + 'isofgzg.gif',
  'frog-pump':                        CDN + 'rQhGcin.gif',
  'hip-thrust-hamstring':             CDN + 'Pjbc0Kt.gif',
  'donkey-calf-raise':                CDN + 'u5ESqzH.gif',
  'standing-calf-raise':              CDN + '8ozhUIZ.gif',
  'swiss-ball-leg-curl':              CDN + 'tgryw5Y.gif',
  'bulgarian-split-squat':            CDN + 'W31mMjd.gif',
  'sumo-squat':                       CDN + 'dzz6BiV.gif',

  // ── Kettlebell exercises ───────────────────────────────────────────────────
  'kettlebell-swing':                 CDN + 'UHJlbu3.gif',
  'kettlebell-goblet-squat':          CDN + 'ZA8b5hc.gif',
  'kettlebell-windmill':              CDN + '9Tkqa9O.gif',
  'kettlebell-clean':                 CDN + 'LHWF7us.gif',
  'kettlebell-snatch':                CDN + 'M74kdvm.gif',
  'kettlebell-press':                 CDN + '5KLbZWx.gif',
  'kettlebell-row':                   CDN + 'Ca76jUE.gif',
  'kettlebell-lunge':                 CDN + 'WKMQzCD.gif',
  'kettlebell-deadlift':              CDN + 'nUwVh7b.gif',
  'turkish-get-up':                   CDN + 'Ha7SZ3y.gif',

  // ── Resistance band exercises ──────────────────────────────────────────────
  'resistance-band-face-pull':        CDN + 'VtTbiP3.gif',
  'resistance-band-squat':            CDN + 'TUZLh71.gif',
  'resistance-band-row':              CDN + 'w1NOByi.gif',
  'resistance-band-bicep-curl':       CDN + 'vUTfFHw.gif',
  'resistance-band-deadlift':         CDN + 'KUaoUV8.gif',
  'resistance-band-glute-bridge':     CDN + 'Y1MsI1l.gif',
  'resistance-band-glute-kickback':   CDN + 'Y1MsI1l.gif',
  'resistance-band-lateral-raise':    CDN + 'sTg7iys.gif',
  'resistance-band-chest-press':      CDN + '4x5Okof.gif',
  'resistance-band-pull-apart':       CDN + 'Y1MsI1l.gif',
  'resistance-band-monster-walk':     CDN + 'Y1MsI1l.gif',
  'resistance-band-tricep-extension': CDN + 'Y1MsI1l.gif',

  // ── Specialty ──────────────────────────────────────────────────────────────
  'thruster':                         CDN + 'f7Y9eDZ.gif',
  'battle-rope-wave':                 CDN + 'dK9394r.gif',
  'sled-push':                        CDN + 'tj41Nu6.gif',
  'pallof-press':                     CDN + 'zd4P4B2.gif',
  'landmine-press':                   CDN + 'zd4P4B2.gif',
  'landmine-rotation':                CDN + 'QYysSLV.gif',
  'lateral-band-walk':                CDN + 'obe5LMq.gif',
};

/** Fallback: slug -> array of static frame URLs (wger.de illustrated images) */
export const EXERCISE_WGER_MAP: Record<string, string[]> = {
  'plank': [
    'https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png',
    'https://wger.de/media/exercise-images/458/902e6836-394e-458b-b94e-101d714294e2.png',
    'https://wger.de/media/exercise-images/458/d1ca4a79-f299-4e70-a391-3e9526c3b141.png',
    'https://wger.de/media/exercise-images/458/b180ce8b-a2c2-40da-924f-998d97aebb63.png',
    'https://wger.de/media/exercise-images/458/167db646-9acb-4426-a383-c7e7dc92e3ec.png',
    'https://wger.de/media/exercise-images/458/e13f92a4-69ae-4043-ae1f-70f155a53024.png',
    'https://wger.de/media/exercise-images/458/bce9a15d-d080-4fb0-bc30-f80778b38793.png',
    'https://wger.de/media/exercise-images/458/2c43d623-5898-4669-b5f8-eb3e1c38cd29.png',
    'https://wger.de/media/exercise-images/458/122735cf-f940-4de8-aa30-49a1da148319.png',
  ],
  'standing-calf-raise': [
    'https://wger.de/media/exercise-images/622/9a429bd0-afd3-4ad0-8043-e9beec901c81.jpeg',
    'https://wger.de/media/exercise-images/622/d6d57067-97de-462e-a8bb-15228d730323.jpeg',
    'https://wger.de/media/exercise-images/622/0705bc22-fadd-4c19-9c94-649a0b1f927f.jpeg',
  ],
  'romanian-deadlift': [
    'https://wger.de/media/exercise-images/1673/4a5bcdfa-e8d4-457f-a7e4-9a9fdff65884.png',
    'https://wger.de/media/exercise-images/1673/4d52df1e-e14a-49cb-a94c-e5372a36a9be.png',
  ],
  'kettlebell-swing': [
    'https://wger.de/media/exercise-images/1612/3dc33f57-2786-4305-8b91-e011d7055923.jpg',
    'https://wger.de/media/exercise-images/1612/e719b872-d122-4e2d-be17-bd2babfe457a.jpg',
  ],
  'incline-dumbbell-press': [
    'https://wger.de/media/exercise-images/1277/9f3c7817-3e3d-417d-8b08-2c0a1aa5fe03.jpg',
  ],
  'cable-lat-pulldown': [
    'https://wger.de/media/exercise-images/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp',
  ],
  'dumbbell-shoulder-press': [
    'https://wger.de/media/exercise-images/418/fa2a2207-43cb-4dc0-bc2a-039e32544790.png',
  ],
  'dumbbell-bicep-curl': [
    'https://wger.de/media/exercise-images/81/a751a438-ae2d-4751-8d61-cef0e9292174.png',
  ],
  'cable-tricep-pushdown': [
    'https://wger.de/media/exercise-images/1185/c5ca283d-8958-4fd8-9d59-a3f52a3ac66b.jpg',
  ],
  'machine-leg-press': [
    'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  ],
  'weighted-dip': [
    'https://wger.de/media/exercise-images/194/34600351-8b0b-4cb0-8daa-583537be15b0.png',
  ],
  'resistance-band-face-pull': [
    'https://wger.de/media/exercise-images/1732/d13b9adb-968e-4f73-95e6-b16690bcf616.jpg',
  ],
};

export type ExerciseMedia =
  | { type: 'gif'; url: string }
  | { type: 'slideshow'; frames: string[] };

/**
 * Returns the best available media for an exercise:
 * - 'gif' if we have an animated GIF (primary)
 * - 'slideshow' if we only have static wger frames (fallback)
 * - null if nothing available
 */
export function getExerciseMedia(slug: string): ExerciseMedia | null {
  const gif = EXERCISE_GIF_MAP[slug];
  if (gif) return { type: 'gif', url: gif };

  const frames = EXERCISE_WGER_MAP[slug];
  if (frames && frames.length > 0) return { type: 'slideshow', frames };

  return null;
}

/** Returns the animated GIF URL for an exercise slug, or null if not found. */
export function getExerciseGifUrl(slug: string): string | null {
  return EXERCISE_GIF_MAP[slug] ?? null;
}

/** Returns wger fallback frames for an exercise, or null. */
export function getExerciseWgerImages(slug: string): string[] | null {
  return EXERCISE_WGER_MAP[slug] ?? null;
}

/**
 * Legacy compat: returns best image URL for a given frame index.
 * For GIFs, returns the GIF regardless of frame.
 * For wger, returns the frame at the given index.
 */
export function getExerciseImageUrl(slug: string, frame: number = 0): string | null {
  const gif = EXERCISE_GIF_MAP[slug];
  if (gif) return gif;
  const frames = EXERCISE_WGER_MAP[slug];
  if (frames && frames.length > 0) return frames[frame % frames.length];
  return null;
}

/** Returns true if we have any media (GIF or wger) for this exercise slug. */
export function hasExerciseImages(slug: string): boolean {
  return slug in EXERCISE_GIF_MAP || slug in EXERCISE_WGER_MAP;
}

/** Returns total frame count (1 for GIF, N for slideshow, 0 if none). */
export function getExerciseFrameCount(slug: string): number {
  if (slug in EXERCISE_GIF_MAP) return 1;
  return EXERCISE_WGER_MAP[slug]?.length ?? 0;
}
