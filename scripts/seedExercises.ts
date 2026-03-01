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
    image_url: null,
    video_url: null,
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
      'Lower fully under control, do not kip unless specified',
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
