import React from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;
const WAVE_HEIGHT = 140;

interface WaveHeaderStat {
  value: string | number;
  label: string;
}

interface WaveHeaderProps {
  title: string;
  subtitle?: string;
  stats?: WaveHeaderStat[];
  gradientFrom?: string;
  gradientTo?: string;
}

export function WaveHeader({
  title,
  subtitle,
  stats,
  gradientFrom = '#16A34A',
  gradientTo = '#0F766E',
}: WaveHeaderProps) {
  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${SCREEN_WIDTH} ${WAVE_HEIGHT}`}>
        <Defs>
          <LinearGradient id="pageWaveGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientFrom} />
            <Stop offset="1" stopColor={gradientTo} />
          </LinearGradient>
        </Defs>
        <Path
          d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},${WAVE_HEIGHT * 0.68} Q${SCREEN_WIDTH * 0.75},${WAVE_HEIGHT * 0.95} ${SCREEN_WIDTH * 0.5},${WAVE_HEIGHT * 0.8} Q${SCREEN_WIDTH * 0.25},${WAVE_HEIGHT * 0.65} 0,${WAVE_HEIGHT * 0.85} Z`}
          fill="url(#pageWaveGrad)"
        />
        <Path
          d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},${WAVE_HEIGHT * 0.58} Q${SCREEN_WIDTH * 0.6},${WAVE_HEIGHT * 0.82} ${SCREEN_WIDTH * 0.35},${WAVE_HEIGHT * 0.7} Q${SCREEN_WIDTH * 0.12},${WAVE_HEIGHT * 0.58} 0,${WAVE_HEIGHT * 0.75} Z`}
          fill="#FFFFFF"
          opacity={0.12}
        />
      </Svg>
      <View style={[styles.overlay, { paddingTop: STATUS_BAR_HEIGHT + 14 }]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {stats && stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', height: WAVE_HEIGHT },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.3)' },
});
