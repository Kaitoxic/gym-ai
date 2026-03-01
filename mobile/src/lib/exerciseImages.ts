/**
 * exerciseImages.ts
 * Maps app exercise slugs to wger.de (Everkinetic) exercise image URLs.
 * Images are freely available from wger.de — illustrated stick-figure style.
 * Each slug maps to an array of frame URLs for slideshow animation.
 */

/** Slug -> ordered array of image URLs (frame 0, frame 1, ...) */
export const EXERCISE_IMAGE_MAP: Record<string, string[]> = {
  "barbell-squat": [
    "https://wger.de/media/exercise-images/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg",
    "https://wger.de/media/exercise-images/1801/68720d5e-f422-47ac-81e4-c7b51144d302.jpg",
  ],
  "deadlift": [
    "https://wger.de/media/exercise-images/161/Dead-lifts-2.png",
    "https://wger.de/media/exercise-images/161/Dead-lifts-1.png",
  ],
  "bench-press": [
    "https://wger.de/media/exercise-images/192/Bench-press-1.png",
    "https://wger.de/media/exercise-images/192/Bench-press-2.png",
  ],
  "overhead-press": [
    "https://wger.de/media/exercise-images/1893/7dbad19e-0616-41fd-9d7d-3e21649c0eea.png",
  ],
  "barbell-row": [
    "https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png",
    "https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-2.png",
  ],
  "romanian-deadlift": [
    "https://wger.de/media/exercise-images/1673/4a5bcdfa-e8d4-457f-a7e4-9a9fdff65884.png",
    "https://wger.de/media/exercise-images/1673/4d52df1e-e14a-49cb-a94c-e5372a36a9be.png",
  ],
  "incline-dumbbell-press": [
    "https://wger.de/media/exercise-images/1277/9f3c7817-3e3d-417d-8b08-2c0a1aa5fe03.jpg",
  ],
  "pull-up": [
    "https://wger.de/media/exercise-images/181/Chin-ups-2.png",
    "https://wger.de/media/exercise-images/181/Chin-ups-1.png",
  ],
  "cable-lat-pulldown": [
    "https://wger.de/media/exercise-images/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp",
  ],
  "dumbbell-shoulder-press": [
    "https://wger.de/media/exercise-images/418/fa2a2207-43cb-4dc0-bc2a-039e32544790.png",
  ],
  "dumbbell-bicep-curl": [
    "https://wger.de/media/exercise-images/81/Biceps-curl-1.png",
    "https://wger.de/media/exercise-images/81/Biceps-curl-2.png",
  ],
  "cable-tricep-pushdown": [
    "https://wger.de/media/exercise-images/1185/c5ca283d-8958-4fd8-9d59-a3f52a3ac66b.jpg",
  ],
  "dumbbell-lunge": [
    "https://wger.de/media/exercise-images/113/Walking-lunges-1.png",
    "https://wger.de/media/exercise-images/113/Walking-lunges-2.png",
  ],
  "leg-press": [
    "https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp",
  ],
  "kettlebell-swing": [
    "https://wger.de/media/exercise-images/1612/3dc33f57-2786-4305-8b91-e011d7055923.jpg",
    "https://wger.de/media/exercise-images/1612/e719b872-d122-4e2d-be17-bd2babfe457a.jpg",
  ],
  "dumbbell-row": [
    "https://wger.de/media/exercise-images/81/a751a438-ae2d-4751-8d61-cef0e9292174.png",
  ],
  "plank": [
    "https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png",
    "https://wger.de/media/exercise-images/458/902e6836-394e-458b-b94e-101d714294e2.png",
  ],
  "standing-calf-raise": [
    "https://wger.de/media/exercise-images/622/9a429bd0-afd3-4ad0-8043-e9beec901c81.jpeg",
    "https://wger.de/media/exercise-images/622/d6d57067-97de-462e-a8bb-15228d730323.jpeg",
  ],
  "weighted-dip": [
    "https://wger.de/media/exercise-images/194/34600351-8b0b-4cb0-8daa-583537be15b0.png",
  ],
  "resistance-band-face-pull": [
    "https://wger.de/media/exercise-images/1732/d13b9adb-968e-4f73-95e6-b16690bcf616.jpg",
  ],
};

/**
 * Returns the URL for a specific frame of an exercise image slideshow.
 * frame 0 = start position, frame 1 = end position (cycles back).
 */
export function getExerciseImageUrl(slug: string, frame: number = 0): string | null {
  const frames = EXERCISE_IMAGE_MAP[slug];
  if (!frames || frames.length === 0) return null;
  return frames[frame % frames.length];
}

/** Returns how many animation frames an exercise has (0 if not found). */
export function getExerciseFrameCount(slug: string): number {
  return EXERCISE_IMAGE_MAP[slug]?.length ?? 0;
}

/** Returns true if we have images for this exercise slug. */
export function hasExerciseImages(slug: string): boolean {
  return slug in EXERCISE_IMAGE_MAP;
}
