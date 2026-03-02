/**
 * exerciseImages.ts
 * Maps app exercise slugs to ExerciseDB animated GIF URLs.
 * GIFs are served from static.exercisedb.dev (public CDN, no auth required).
 * Each slug maps to a single animated GIF URL showing the full movement.
 */

const CDN = 'https://static.exercisedb.dev/media/';

/** Slug -> animated GIF URL */
export const EXERCISE_GIF_MAP: Record<string, string> = {
  'barbell-squat':             CDN + 'oR7O9LW.gif',  // barbell squat (on knees)
  'deadlift':                  CDN + 'ila4NZS.gif',  // barbell deadlift
  'bench-press':               CDN + 'EIeI8Vf.gif',  // barbell bench press
  'overhead-press':            CDN + 'kTbSH9h.gif',  // barbell seated overhead press
  'barbell-row':               CDN + 'eZyBC3j.gif',  // barbell bent over row
  'romanian-deadlift':         CDN + 'wQ2c4XD.gif',  // barbell romanian deadlift
  'incline-dumbbell-press':    CDN + 'ns0SIbU.gif',  // dumbbell incline bench press
  'pull-up':                   CDN + 'lBDjFxJ.gif',  // pull-up
  'cable-lat-pulldown':        CDN + 'LEprlgG.gif',  // cable lat pulldown full range of motion
  'dumbbell-shoulder-press':   CDN + 'znQUdHY.gif',  // dumbbell seated shoulder press
  'dumbbell-bicep-curl':       CDN + 'uSkDMYl.gif',  // dumbbell bicep curl
  'cable-tricep-pushdown':     CDN + 'gAwDzB3.gif',  // cable triceps pushdown (v-bar)
  'dumbbell-lunge':            CDN + 'RRWFUcw.gif',  // dumbbell lunge
  'leg-press':                 CDN + '10Z2DXU.gif',  // sled 45° leg press
  'kettlebell-swing':          CDN + 'UHJlbu3.gif',  // kettlebell swing
  'dumbbell-row':              CDN + 'BJ0Hz5L.gif',  // dumbbell bent over row
  'plank':                     CDN + 'VBAWRPG.gif',  // weighted front plank
  'standing-calf-raise':       CDN + 'bJYHBIN.gif',  // bodyweight standing calf raise
  'weighted-dip':              CDN + 'K1vlode.gif',  // weighted triceps dip on high parallel bars
  'resistance-band-face-pull': CDN + 'G61cXLk.gif',  // cable kneeling rear delt row (with rope)
};

/** Returns the animated GIF URL for an exercise slug, or null if not found. */
export function getExerciseGifUrl(slug: string): string | null {
  return EXERCISE_GIF_MAP[slug] ?? null;
}

/**
 * Legacy compat: returns GIF URL regardless of frame param.
 * Kept so callers that pass a frame number still work during migration.
 */
export function getExerciseImageUrl(slug: string, _frame: number = 0): string | null {
  return getExerciseGifUrl(slug);
}

/** Returns 1 if we have a GIF for this slug, 0 otherwise. */
export function getExerciseFrameCount(slug: string): number {
  return slug in EXERCISE_GIF_MAP ? 1 : 0;
}

/** Returns true if we have a GIF for this exercise slug. */
export function hasExerciseImages(slug: string): boolean {
  return slug in EXERCISE_GIF_MAP;
}
