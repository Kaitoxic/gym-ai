import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { BarChart } from 'react-native-chart-kit';
import { useWorkoutStore } from '../store/workoutStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Radar Chart ────────────────────────────────────────────────────────────

const RADAR_LABELS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];
const RADAR_KEYS = ['push', 'pull', 'legs', 'upper', 'lower', 'full body'];
const N = RADAR_LABELS.length;
const RADAR_SIZE = 160; // radius of chart area
const CENTER = RADAR_SIZE + 20;
const SVG_SIZE = (RADAR_SIZE + 20) * 2;

function polarToXY(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function RadarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const levels = 4;

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const r = (RADAR_SIZE * (i + 1)) / levels;
    const points = Array.from({ length: N }, (_, j) => {
      const angle = (360 / N) * j - 90;
      const { x, y } = polarToXY(angle, r);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });

  // Data polygon
  const dataPoints = data.map((val, i) => {
    const angle = (360 / N) * i - 90;
    const r = (val / max) * RADAR_SIZE;
    return polarToXY(angle, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Axis lines
  const axes = Array.from({ length: N }, (_, i) => {
    const angle = (360 / N) * i - 90;
    return polarToXY(angle, RADAR_SIZE);
  });

  // Label positions (slightly beyond axis end)
  const labelPositions = Array.from({ length: N }, (_, i) => {
    const angle = (360 / N) * i - 90;
    return polarToXY(angle, RADAR_SIZE + 16);
  });

  return (
    <Svg width={SVG_SIZE} height={SVG_SIZE}>
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <Polygon
          key={i}
          points={pts}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {axes.map((end, i) => (
        <Line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={end.x}
          y2={end.y}
          stroke="#2a2a2a"
          strokeWidth={1}
        />
      ))}
      {/* Data polygon */}
      <Polygon
        points={dataPolygon}
        fill="#a78bfa33"
        stroke="#a78bfa"
        strokeWidth={2}
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#a78bfa" />
      ))}
      {/* Labels */}
      {labelPositions.map((pos, i) => (
        <SvgText
          key={i}
          x={pos.x}
          y={pos.y}
          fill="#888"
          fontSize={10}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {RADAR_LABELS[i]}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { history, streak, loadingHistory, fetchHistory, fetchStreak } = useWorkoutStore();

  useEffect(() => {
    fetchHistory();
    fetchStreak();
  }, []);

  // ── Summary stats
  const totalSessions = history.length;
  const totalSets = useMemo(
    () => history.reduce((sum, log) => sum + (log.sets_done?.length ?? 0), 0),
    [history]
  );
  const totalSeconds = useMemo(
    () => history.reduce((sum, log) => sum + (log.duration_seconds ?? 0), 0),
    [history]
  );

  // ── Sessions per week (last 8 weeks)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks: number[] = Array(8).fill(0);
    history.forEach((log) => {
      const d = new Date(log.completed_at);
      const diffMs = now.getTime() - d.getTime();
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 3600 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 8) {
        weeks[7 - diffWeeks] += 1;
      }
    });
    return weeks;
  }, [history]);

  const barLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      labels.push(
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
    }
    return labels;
  }, []);

  // ── Radar data: count sessions per day type
  const radarData = useMemo(() => {
    const counts: number[] = Array(N).fill(0);
    history.forEach((log) => {
      const name = (log.day_name ?? '').toLowerCase();
      const idx = RADAR_KEYS.findIndex((k) => name.includes(k));
      if (idx !== -1) counts[idx] += 1;
    });
    return counts;
  }, [history]);

  // ── Recent sessions (last 5)
  const recent = history.slice(0, 5);

  if (loadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>

        {/* ── Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSets}</Text>
            <Text style={styles.summaryLabel}>Total Sets</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{streak}</Text>
            <Text style={styles.summaryLabel}>Day Streak 🔥</Text>
          </View>
        </View>

        {/* ── Total time */}
        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>Total Time Trained</Text>
          <Text style={styles.timeValue}>{formatDuration(totalSeconds)}</Text>
        </View>

        {/* ── Bar chart */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions / Week (last 8 weeks)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{
                  labels: barLabels,
                  datasets: [{ data: weeklyData }],
                }}
                width={Math.max(SCREEN_WIDTH - 32, barLabels.length * 72)}
                height={200}
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundGradientFrom: '#1a1a1a',
                  backgroundGradientTo: '#1a1a1a',
                  decimalPlaces: 0,
                  color: () => '#a78bfa',
                  labelColor: () => '#666',
                  propsForBars: { rx: 4 },
                  propsForLabels: { fontSize: 9 },
                }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </ScrollView>
          </View>
        )}

        {/* ── Radar chart */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Distribution</Text>
            <View style={styles.radarWrap}>
              <RadarChart data={radarData} />
            </View>
          </View>
        )}

        {/* ── Recent sessions */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {recent.map((log) => (
              <View key={log.id} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName}>{log.day_name}</Text>
                  <Text style={styles.sessionDate}>{formatDate(log.completed_at)}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionStat}>{log.sets_done?.length ?? 0} sets</Text>
                  <Text style={styles.sessionDur}>{formatDuration(log.duration_seconds)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {history.length === 0 && (
          <Text style={styles.empty}>No workouts yet. Complete your first session to see stats!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: { color: '#a78bfa', fontSize: 26, fontWeight: '800' },
  summaryLabel: { color: '#777', fontSize: 11, marginTop: 4, textAlign: 'center' },

  timeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeLabel: { color: '#888', fontSize: 13 },
  timeValue: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { marginBottom: 28 },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },

  chart: { borderRadius: 12 },

  radarWrap: { alignItems: 'center' },

  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionLeft: { flex: 1 },
  sessionName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sessionDate: { color: '#555', fontSize: 12, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionStat: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },
  sessionDur: { color: '#555', fontSize: 12, marginTop: 2 },

  empty: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 60, lineHeight: 22 },
});
