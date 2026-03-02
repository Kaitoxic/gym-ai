import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExercisesStackParamList } from '../../navigation/ExercisesNavigator';
import { getExerciseMedia, hasExerciseImages } from '../../lib/exerciseImages';

type Props = NativeStackScreenProps<ExercisesStackParamList, 'ExerciseDetail'>;

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

/** Unified media component: shows animated GIF, YouTube thumbnail, or multi-frame slideshow */
function ExerciseMedia({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const media = getExerciseMedia(slug);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setFrame(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (media?.type === 'slideshow' && media.frames.length > 1) {
      intervalRef.current = setInterval(() => {
        setFrame((f) => (f + 1) % media.frames.length);
      }, 1200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slug]);

  if (!media) return null;

  // YouTube video
  if (media.type === 'video') {
    return (
      <View style={styles.imageContainer}>
        {loading && !error && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
        {!error && (
          <Image
            source={{ uri: media.thumbnail }}
            style={[styles.exerciseImage, loading && styles.hidden]}
            resizeMode="cover"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
        {error && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageErrorText}>Apercu non disponible</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.ytBtn}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${media.videoId}`)}
        >
          <Text style={styles.ytBtnText}>▶ Voir sur YouTube</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUrl = media.type === 'gif' ? media.url : media.frames[frame];
  const frameCount = media.type === 'slideshow' ? media.frames.length : 0;

  return (
    <View style={styles.imageContainer}>
      {loading && !error && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
      {error && (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageErrorText}>Image non disponible</Text>
        </View>
      )}
      {!error && currentUrl && (
        <Image
          source={{ uri: currentUrl }}
          style={[styles.exerciseImage, loading && styles.hidden]}
          resizeMode="contain"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
      {!loading && !error && frameCount > 1 && (
        <View style={styles.frameIndicator}>
          {media.type === 'slideshow' && media.frames.map((_, i) => (
            <View key={i} style={[styles.frameDot, i === frame && styles.frameDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ExerciseDetailScreen({ route }: Props) {
  const { exercise } = route.params;
  const diffColor = DIFFICULTY_COLOR[exercise.difficulty] ?? '#6366f1';
  const showImages = hasExerciseImages(exercise.slug);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.name}>{exercise.name}</Text>

        <View style={styles.row}>
          <Tag label={capitalize(exercise.difficulty)} color={diffColor} />
        </View>

        {showImages && <ExerciseMedia slug={exercise.slug} />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Groups</Text>
          <View style={styles.tagRow}>
            {exercise.muscle_groups.map((m) => (
              <Tag key={m} label={capitalize(m)} color="#a78bfa" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.tagRow}>
            {exercise.equipment.map((e) => (
              <Tag key={e} label={capitalize(e)} color="#60a5fa" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {exercise.instructions.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, paddingBottom: 40 },
  name: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  imageContainer: {
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  exerciseImage: { width: '100%', height: 220 },
  hidden: { opacity: 0 },
  imagePlaceholder: {
    height: 220,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageErrorText: { color: '#555', fontSize: 13 },
  frameIndicator: { flexDirection: 'row', gap: 4, paddingVertical: 6, flexWrap: 'wrap', justifyContent: 'center' },
  frameDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  frameDotActive: { backgroundColor: '#6366f1' },
  ytBtn: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: '#ff0000dd',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  ytBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  section: { marginTop: 24 },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontWeight: '600' },
  stepRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  stepText: { color: '#d1d5db', fontSize: 14, lineHeight: 22, flex: 1 },
});
