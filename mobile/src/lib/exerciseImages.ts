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
  'barbell-squat':             CDN + 'oR7O9LW.gif',
  'deadlift':                  CDN + 'ila4NZS.gif',
  'bench-press':               CDN + 'EIeI8Vf.gif',
  'overhead-press':            CDN + 'kTbSH9h.gif',
  'barbell-row':               CDN + 'eZyBC3j.gif',
  'romanian-deadlift':         CDN + 'wQ2c4XD.gif',
  'incline-dumbbell-press':    CDN + 'ns0SIbU.gif',
  'pull-up':                   CDN + 'lBDjFxJ.gif',
  'cable-lat-pulldown':        CDN + 'LEprlgG.gif',
  'dumbbell-shoulder-press':   CDN + 'znQUdHY.gif',
  'dumbbell-bicep-curl':       CDN + 'uSkDMYl.gif',
  'cable-tricep-pushdown':     CDN + 'gAwDzB3.gif',
  'dumbbell-lunge':            CDN + 'RRWFUcw.gif',
  'leg-press':                 CDN + '10Z2DXU.gif',
  'kettlebell-swing':          CDN + 'UHJlbu3.gif',
  'dumbbell-row':              CDN + 'BJ0Hz5L.gif',
  'plank':                     CDN + 'VBAWRPG.gif',
  'standing-calf-raise':       CDN + 'bJYHBIN.gif',
  'weighted-dip':              CDN + 'K1vlode.gif',
  'resistance-band-face-pull': CDN + 'G61cXLk.gif',
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
  'barbell-squat': [
    'https://wger.de/media/exercise-images/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg',
    'https://wger.de/media/exercise-images/1801/68720d5e-f422-47ac-81e4-c7b51144d302.jpg',
  ],
  'romanian-deadlift': [
    'https://wger.de/media/exercise-images/1673/4a5bcdfa-e8d4-457f-a7e4-9a9fdff65884.png',
    'https://wger.de/media/exercise-images/1673/4d52df1e-e14a-49cb-a94c-e5372a36a9be.png',
  ],
  'kettlebell-swing': [
    'https://wger.de/media/exercise-images/1612/3dc33f57-2786-4305-8b91-e011d7055923.jpg',
    'https://wger.de/media/exercise-images/1612/e719b872-d122-4e2d-be17-bd2babfe457a.jpg',
  ],
  'overhead-press': [
    'https://wger.de/media/exercise-images/1893/7dbad19e-0616-41fd-9d7d-3e21649c0eea.png',
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
  'leg-press': [
    'https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp',
  ],
  'dumbbell-row': [
    'https://wger.de/media/exercise-images/81/a751a438-ae2d-4751-8d61-cef0e9292174.png',
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
