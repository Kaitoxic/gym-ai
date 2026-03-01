import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/lib/supabase';

interface Exercise {
  slug: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  image_url: null;
  video_url: null;
}

const EXERCISES: Exercise[] = [
  {
    slug: 'barbell-squat',
    name: 'Barbell Back Squat',
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['barbell', 'rack'],
    difficulty: 'intermediate',
    instructions: [
      'Set the bar at shoulder height on the rack and step underneath it',
      'Grip the bar slightly wider than shoulder width, brace your core',
      'Step back, feet shoulder-width apart, toes slightly out',
      'Descend by pushing knees out and hips back until thighs are parallel',
      'Drive through heels to stand, keeping chest tall',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'deadlift',
    name: 'Conventional Deadlift',
    muscle_groups: ['hamstrings', 'glutes', 'back', 'traps'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips, grip bar just outside legs',
      'Flatten back, chest up, shoulders slightly over the bar',
      'Drive feet into floor, extend hips and knees simultaneously',
      'Lock out at the top, then hinge back down under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'bench-press',
    name: 'Barbell Bench Press',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench, eyes under bar, feet flat on floor',
      'Grip bar slightly wider than shoulder width, unrack',
      'Lower bar to lower chest under control, elbows at ~75 degrees',
      'Press back up explosively, fully extending elbows at top',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'pull-up',
    name: 'Pull-Up',
    muscle_groups: ['back', 'biceps', 'core'],
    equipment: ['bodyweight', 'pull-up-bar'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from bar with overhand grip, hands shoulder-width apart',
      'Depress shoulder blades and engage lats',
      'Pull chin over bar by driving elbows down and back',
      'Lower fully under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'overhead-press',
    name: 'Barbell Overhead Press',
    muscle_groups: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with bar at collarbone level, elbows slightly in front of bar',
      'Brace core and glutes',
      'Press bar straight up, moving head back then forward to clear the bar',
      'Lock out overhead, shrug traps slightly at top',
      'Lower to clavicle under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'dumbbell-lunge',
    name: 'Dumbbell Lunge',
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    instructions: [
      'Stand tall holding a dumbbell in each hand',
      'Step forward with one foot, lowering the back knee toward the floor',
      'Front knee stays above ankle, do not let it cave inward',
      'Push through the front heel to return to standing',
      'Alternate legs each rep',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    muscle_groups: ['back', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    instructions: [
      'Place one hand and knee on a bench for support',
      'Hold a dumbbell in the free hand, arm extended',
      'Row the dumbbell toward your hip, driving the elbow straight back',
      'Squeeze the lat at the top, then lower under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'cable-lat-pulldown',
    name: 'Cable Lat Pulldown',
    muscle_groups: ['back', 'biceps'],
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Sit at a lat pulldown station, thighs secured under pad',
      'Grip the bar wider than shoulder width, palms facing forward',
      'Lean back slightly and pull the bar to your upper chest',
      'Squeeze the lats, then return the bar overhead under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscle_groups: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    instructions: [
      'Sit on a bench with back support, dumbbells at shoulder height',
      'Press dumbbells straight up until arms are fully extended',
      'Do not shrug or arch the lower back excessively',
      'Lower dumbbells back to shoulder height under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'cable-tricep-pushdown',
    name: 'Cable Tricep Pushdown',
    muscle_groups: ['triceps'],
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Stand at a cable machine, attach a straight bar or rope at chest height',
      'Grip the attachment, elbows tucked close to your sides',
      'Push the attachment down until arms are fully extended',
      'Squeeze triceps at the bottom, then return slowly',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'dumbbell-bicep-curl',
    name: 'Dumbbell Bicep Curl',
    muscle_groups: ['biceps'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    instructions: [
      'Stand holding dumbbells at your sides, palms facing forward',
      'Curl both dumbbells up toward your shoulders, keeping elbows fixed',
      'Squeeze the biceps at the top',
      'Lower slowly back to starting position',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'plank',
    name: 'Plank',
    muscle_groups: ['core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Get into a push-up position with forearms on the floor',
      'Body forms a straight line from head to heels',
      'Engage core, glutes, and quads â€” do not let hips sag or rise',
      'Hold for the target duration, breathing steadily',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscle_groups: ['calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet hip-width apart, toes pointing forward',
      'Rise up onto the balls of your feet as high as possible',
      'Hold briefly at the top, then lower heels slowly',
      'Use a wall or rack for balance if needed',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscle_groups: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand holding a barbell at hip height, feet hip-width apart',
      'Hinge at the hips, pushing them back while keeping the bar close to your legs',
      'Lower until you feel a strong stretch in the hamstrings',
      'Drive hips forward to return to standing, squeeze glutes at top',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscle_groups: ['chest', 'shoulders', 'triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to 30-45 degree incline, sit back with dumbbells at shoulder height',
      'Press dumbbells up and slightly together, fully extending arms',
      'Lower under control until dumbbells are level with the upper chest',
      'Keep shoulder blades retracted throughout',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    muscle_groups: ['glutes', 'hamstrings', 'core'],
    equipment: ['kettlebell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with feet shoulder-width apart, kettlebell on floor in front of you',
      'Hinge at hips, grip the kettlebell, hike it back between your legs',
      'Drive hips forward explosively to swing the kettlebell to chest height',
      'Let it swing back between legs and repeat â€” power comes from hips, not arms',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'leg-press',
    name: 'Machine Leg Press',
    muscle_groups: ['quadriceps', 'glutes'],
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit in the leg press machine, feet shoulder-width apart on the platform',
      'Release the safety handles and lower the platform until knees reach 90 degrees',
      'Press through heels to extend legs, do not lock out knees completely',
      'Return slowly and repeat',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'resistance-band-face-pull',
    name: 'Resistance Band Face Pull',
    muscle_groups: ['shoulders', 'back'],
    equipment: ['resistance_band'],
    difficulty: 'beginner',
    instructions: [
      'Anchor a resistance band at face height',
      'Hold both ends, step back until there is tension in the band',
      'Pull the band toward your face, separating your hands as you pull',
      'Elbows stay high and flared out, squeeze rear delts at the end',
      'Return slowly under control',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'weighted-dip',
    name: 'Weighted Dip',
    muscle_groups: ['triceps', 'chest', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'advanced',
    instructions: [
      'Attach a weight plate or dumbbell to a dip belt',
      'Grip parallel bars, arms locked out, feet crossed behind you',
      'Lower yourself until upper arms are parallel to the floor',
      'Press back up to full lockout â€” keep torso upright to target triceps',
    ],
    image_url: null, video_url: null,
  },
  {
    slug: 'barbell-row',
    name: 'Barbell Bent-Over Row',
    muscle_groups: ['back', 'biceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: [
      'Stand with feet hip-width apart, grip barbell with overhand grip',
      'Hinge at hips until torso is roughly parallel to the floor',
      'Row the bar to your lower chest, driving elbows straight back',
      'Squeeze lats and rhomboids at the top, lower under control',
      'Maintain a neutral spine throughout â€” do not round your lower back',
    ],
    image_url: null, video_url: null,
  },
];

async function main() {
  console.log(`Seeding ${EXERCISES.length} exercises...`);
  const { error } = await supabase
    .from('exercises')
    .upsert(EXERCISES, { onConflict: 'slug' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${EXERCISES.length} exercises successfully.`);
}

main();