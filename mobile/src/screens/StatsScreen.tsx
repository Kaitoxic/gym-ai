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
import { useWorkoutStore } from '../store/workoutStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Custom Bar Chart ────────────────────────────────────────────────────────

const BAR_MAX_H = 100;

function CustomBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={barStyles.wrap}>
        {data.map((val, i) => (
          <View key={i} style={barStyles.col}>
            {val > 0 && <Text style={barStyles.valLabel}>{val}</Text>}
            <View
              style={[
                barStyles.bar,
                {
                  height: Math.max((val / max) * BAR_MAX_H, val > 0 ? 5 : 2),
                  backgroundColor: val > 0 ? '#a78bfa' : '#2a2a2a',
                },
              ]}
            />
            <Text style={barStyles.dateLabel}>{labels[i]}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: SCREEN_WIDTH - 32,
  },
  col: { alignItems: 'center', width: 38 },
  valLabel: { color: '#a78bfa', fontSize: 10, marginBottom: 2 },
  bar: { width: 28, borderRadius: 4 },
  dateLabel: { color: '#555', fontSize: 8, marginTop: 4, textAlign: 'center' },
});

// ─── Radar Chart ─────────────────────────────────────────────────────────────

const RADAR_LABELS = ['Force', 'Endurance', 'Santé', 'Sommeil'];
const N = RADAR_LABELS.length;
const RADAR_R = 120;
const CENTER = RADAR_R + 36;
const SVG_SIZE = (RADAR_R + 36) * 2;

function polarToXY(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function RadarChart({ data }: { data: number[] }) {
  const levels = 4;

  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = (RADAR_R * (lvl + 1)) / levels;
    return Array.from({ length: N }, (_, j) => {
      const { x, y } = polarToXY((360 / N) * j - 90, r);
      return `${x},${y}`;
    }).join(' ');
  });

  const dataPoints = data.map((val, i) => {
    const r = (Math.min(val, 100) / 100) * RADAR_R;
    return polarToXY((360 / N) * i - 90, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const axes = Array.from({ length: N }, (_, i) => polarToXY((360 / N) * i - 90, RADAR_R));
  const labelPos = Array.from({ length: N }, (_, i) => polarToXY((360 / N) * i - 90, RADAR_R + 18));

  return (
    <Svg width={SVG_SIZE} height={SVG_SIZE}>
      {gridPolygons.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke="#2a2a2a" strokeWidth={1} />
      ))}
      {axes.map((end, i) => (
        <Line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#2a2a2a" strokeWidth={1} />
      ))}
      <Polygon points={dataPolygon} fill="#a78bfa33" stroke="#a78bfa" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#a78bfa" />
      ))}
      {labelPos.map((pos, i) => (
        <SvgText
          key={i}
          x={pos.x}
          y={pos.y}
          fill={data[i] > 0 ? '#ccc' : '#555'}
          fontSize={11}
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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { history, streak, loadingHistory, fetchHistory, fetchStreak } = useWorkoutStore();

  useEffect(() => {
    fetchHistory();
    fetchStreak();
  }, []);

  const totalSessions = history.length;
  const totalSets = useMemo(() => history.reduce((s, l) => s + (l.sets_done?.length ?? 0), 0), [history]);
  const totalSeconds = useMemo(() => history.reduce((s, l) => s + (l.duration_seconds ?? 0), 0), [history]);

  // Sessions per week last 8 weeks
  const { weeklyData, weekLabels } = useMemo(() => {
    const now = new Date();
    const weeks: number[] = Array(8).fill(0);
    history.forEach((log) => {
      const diffWeeks = Math.floor((now.getTime() - new Date(log.completed_at).getTime()) / (7 * 24 * 3600 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 8) weeks[7 - diffWeeks]++;
    });
    const labels = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (7 - i) * 7);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    return { weeklyData: weeks, weekLabels: labels };
  }, [history]);

  // Radar: Force / Endurance / Santé / Sommeil (0-100)
  const radarData = useMemo(() => {
    if (history.length === 0) return [0, 0, 0, 0];

    // Force: avg weight across completed sets, cap 100kg
    const allSets = history.flatMap((l) => l.sets_done ?? []);
    const wSets = allSets.filter((s) => s.weight_kg != null && s.weight_kg > 0);
    const avgWeight = wSets.length > 0
      ? wSets.reduce((sum, s) => sum + (s.weight_kg ?? 0), 0) / wSets.length
      : 0;
    const force = Math.min((avgWeight / 100) * 100, 100);

    // Endurance: avg session duration, cap 5400s (90min)
    const withDur = history.filter((l) => (l.duration_seconds ?? 0) > 0);
    const avgDur = withDur.length > 0
      ? withDur.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0) / withDur.length
      : 0;
    const endurance = Math.min((avgDur / 5400) * 100, 100);

    // Santé: sessions in last 28 days, max = 20 (5/week × 4)
    const cutoff = Date.now() - 28 * 24 * 3600 * 1000;
    const recentCount = history.filter((l) => new Date(l.completed_at).getTime() >= cutoff).length;
    const sante = Math.min((recentCount / 20) * 100, 100);

    // Sommeil: placeholder (0 until sleep chapter added)
    return [Math.round(force), Math.round(endurance), Math.round(sante), 0];
  }, [history]);

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

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Séances</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSets}</Text>
            <Text style={styles.summaryLabel}>Séries totales</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{streak}</Text>
            <Text style={styles.summaryLabel}>Streak 🔥</Text>
          </View>
        </View>

        {/* Total time */}
        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>Temps total d'entraînement</Text>
          <Text style={styles.timeValue}>{formatDuration(totalSeconds)}</Text>
        </View>

        {/* Bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Séances / Semaine (8 dernières semaines)</Text>
          <View style={styles.chartBox}>
            <CustomBarChart data={weeklyData} labels={weekLabels} />
          </View>
        </View>

        {/* Radar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aperçu global</Text>
          <View style={styles.radarWrap}>
            <RadarChart data={radarData} />
            <Text style={styles.radarHint}>Sommeil disponible bientôt</Text>
          </View>
        </View>

        {/* Recent sessions */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Séances récentes</Text>
            {recent.map((log) => (
              <View key={log.id} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName}>{log.day_name}</Text>
                  <Text style={styles.sessionDate}>{formatDate(log.completed_at)}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionStat}>{log.sets_done?.length ?? 0} séries</Text>
                  <Text style={styles.sessionDur}>{formatDuration(log.duration_seconds)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {history.length === 0 && (
          <Text style={styles.empty}>
            Aucune séance pour l'instant.{'\n'}Complète ta première session pour voir tes stats !
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: { color: '#a78bfa', fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: '#777', fontSize: 10, marginTop: 3, textAlign: 'center' },

  timeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeLabel: { color: '#888', fontSize: 13 },
  timeValue: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { marginBottom: 28 },
  sectionTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 12,
  },

  radarWrap: { alignItems: 'center' },
  radarHint: { color: '#444', fontSize: 11, marginTop: 4 },

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
