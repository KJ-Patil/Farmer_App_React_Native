import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { usePlotStore } from '../../../shared/hooks/usePlotStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AddCropModal } from '../../crops/components/AddCropModal';

export function PlotDashboardScreen({ route, navigation }: any) {
  const { plotId } = route.params;
  const [addCropVisible, setAddCropVisible] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { plots, crops, fetchCrops, getPlotRemainingArea } = usePlotStore();

  const plot = plots.find((p) => p.id === plotId);
  const plotCrops = crops[plotId] || [];
  const remaining = getPlotRemainingArea(plotId);
  const usedArea = plot ? plot.area - remaining : 0;

  useEffect(() => {
    fetchCrops(plotId);
  }, [plotId]);

  if (!plot) return null;

  const occupancyPercent = plot.area > 0 ? (usedArea / plot.area) * 100 : 0;

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>{plot.name}</Text>

        <Card style={{ marginTop: 12 }}>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('gatNumber')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{plot.gatNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('area')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{plot.area} {t(plot.areaUnit)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('soilType')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{t(plot.soilType)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('irrigationType')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{plot.irrigationType}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('area')} Occupancy</Text>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${Math.min(occupancyPercent, 100)}%`, backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.areaStats}>
            <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{t('usedArea')}: {usedArea.toFixed(2)}</Text>
            <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{t('remainingArea')}: {remaining.toFixed(2)}</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Crops</Text>
          <Button
            title={t('addCrop')}
            onPress={() => setAddCropVisible(true)}
            size="sm"
            disabled={remaining <= 0}
          />
        </View>

        {remaining <= 0 && (
          <Text style={{ color: colors.warning, fontSize: 12, marginBottom: 8 }}>{t('areaExceeded')}</Text>
        )}

        {plotCrops.map((crop) => (
          <TouchableOpacity
            key={crop.id}
            onPress={() => navigation.navigate('CropDashboard', { plotId, cropId: crop.id })}
          >
            <Card style={{ marginBottom: 8 }}>
              <View style={styles.cropRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cropName, { color: colors.foreground }]}>{crop.cropType} — {crop.variety}</Text>
                  <Text style={{ color: colors.mutedFg, fontSize: 12 }}>
                    {crop.area} {crop.areaUnit} • {t(crop.season)} • {crop.sowingDate}
                  </Text>
                </View>
                <Badge
                  text={t(crop.status)}
                  variant={crop.status === 'harvested' || crop.status === 'completed' ? 'success' : crop.status === 'flowering' ? 'warning' : 'info'}
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddCropModal visible={addCropVisible} onClose={() => { setAddCropVisible(false); fetchCrops(plotId); }} plotId={plotId} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  areaStats: { flexDirection: 'row', justifyContent: 'space-between' },
  cropRow: { flexDirection: 'row', alignItems: 'center' },
  cropName: { fontSize: 15, fontWeight: '600' },
});
