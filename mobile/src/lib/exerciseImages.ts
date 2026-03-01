/**
 * exerciseImages.ts
 * Maps app exercise slugs to yuhonas/free-exercise-db image IDs.
 */

export const EXERCISE_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const EXERCISE_IMAGE_MAP: Record<string, string> = {
  'barbell-squat': 'Barbell_Full_Squat',
  'deadlift': 'Barbell_Deadlift',
  'bench-press': 'Barbell_Bench_Press_-_Medium_Grip',
  'overhead-press': 'Barbell_Shoulder_Press',
  'barbell-row': 'Bent_Over_Barbell_Row',
  'romanian-deadlift': 'Romanian_Deadlift',
  'incline-dumbbell-press': 'Incline_Dumbbell_Press',
  'pull-up': 'Pullups',
  'cable-lat-pulldown': 'Wide-Grip_Lat_Pulldown',
  'dumbbell-shoulder-press': 'Dumbbell_Shoulder_Press',
  'dumbbell-bicep-curl': 'Dumbbell_Bicep_Curl',
  'cable-tricep-pushdown': 'Triceps_Pushdown',
  'dumbbell-lunge': 'Dumbbell_Lunges',
  'leg-press': 'Leg_Press',
  'kettlebell-swing': 'One-Arm_Kettlebell_Swings',
  'dumbbell-row': 'One-Arm_Dumbbell_Row',
  'plank': 'Plank',
  'standing-calf-raise': 'Standing_Calf_Raises',
  'weighted-dip': 'Dips_-_Triceps_Version',
  'resistance-band-face-pull': 'Face_Pull',
};
export function getExerciseImageUrl(slug: string, frame: 0 | 1 = 0): string | null {
  const id = EXERCISE_IMAGE_MAP[slug];
  if (!id) return null;
  return `${EXERCISE_IMAGE_BASE}${id}/${frame}.jpg`;
}

export function hasExerciseImages(slug: string): boolean {
  return slug in EXERCISE_IMAGE_MAP;
}
