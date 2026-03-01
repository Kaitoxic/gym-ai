import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExercisesStackParamList } from '../../navigation/ExercisesNavigator';
import { useExerciseStore, type Exercise } from '../../store/exerciseStore';

type Nav = NativeStackNavigationProp<ExercisesStackParamList, 'ExerciseList'>;

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

const EQUIPMENT_LIST = [
  'barbell', 'dumbbells', 'cables', 'machines',
  'kettlebell', 'resistance_bands', 'pull_up_bar', 'bodyweight',
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}

function Chip({ label, active, onPress, color }: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: color ?? '#6366f1', borderColor: color ?? '#6366f1' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {capitalize(label)}
      </Text>
    </TouchableOpacity>
  );
}

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const diffColor = DIFFICULTY_COLOR[exercise.difficulty] ?? '#6366f1';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{exercise.name}</Text>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '22', borderColor: diffColor }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>
            {capitalize(exercise.difficulty)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardMuscles} numberOfLines={1}>
        {exercise.muscle_groups.map(capitalize).join(' · ')}
      </Text>
      <Text style={styles.cardEquipment} numberOfLines={1}>
        {exercise.equipment.map(capitalize).join(', ')}
      </Text>
    </TouchableOpacity>
  );
}

export default function ExerciseListScreen() {
  const navigation = useNavigation<Nav>();
  const {
    loading, error,
    searchQuery, filterMuscle, filterEquipment, filterDifficulty,
    fetchExercises, setSearchQuery, setFilterMuscle, setFilterEquipment, setFilterDifficulty,
    getFiltered,
  } = useExerciseStore();

  useEffect(() => {
    fetchExercises();
  }, []);

  const filtered = getFiltered();

  const handleRefresh = useCallback(() => {
    fetchExercises(true);
  }, [fetchExercises]);

  const renderItem = useCallback(({ item }: { item: Exercise }) => (
    <ExerciseCard
      exercise={item}
      onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
    />
  ), [navigation]);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <Text style={styles.filterLabel}>Muscle</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {MUSCLE_GROUPS.map((m) => (
            <Chip
              key={m}
              label={m}
              active={filterMuscle === m}
              onPress={() => setFilterMuscle(filterMuscle === m ? null : m)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Equipment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {EQUIPMENT_LIST.map((e) => (
            <Chip
              key={e}
              label={e}
              active={filterEquipment === e}
              onPress={() => setFilterEquipment(filterEquipment === e ? null : e)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Difficulty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              label={d}
              active={filterDifficulty === d}
              color={DIFFICULTY_COLOR[d]}
              onPress={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      {!loading && (
        <Text style={styles.countText}>
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No exercises found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filtersWrapper: { paddingHorizontal: 16 },
  filterLabel: { color: '#888', fontSize: 11, fontWeight: '600', marginTop: 8, marginBottom: 4, textTransform: 'uppercase' },
  filterRow: { marginBottom: 4 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  chipText: { color: '#888', fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  countText: { color: '#555', fontSize: 12, paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { color: '#ffffff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  diffText: { fontSize: 11, fontWeight: '600' },
  cardMuscles: { color: '#a78bfa', fontSize: 12, marginBottom: 2 },
  cardEquipment: { color: '#555', fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#555', fontSize: 14 },
});
