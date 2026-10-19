import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { usePlotStore } from '../../../shared/hooks/usePlotStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';

const STATUS_ORDER = ['sown', 'vegetative', 'flowering', 'harvested'] as const;

export function CropDashboardScreen({ route }: any) {
  const { plotId, cropId } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { crops, updateCrop } = usePlotStore();

  const plotCrops = crops[plotId] || [];
  const crop = plotCrops.find((c) => c.id === cropId);

  const [harvestDate, setHarvestDate] = useState('');
  const [actualYield, setActualYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState('Quintal');

  if (!crop) return null;

  const currentIdx = STATUS_ORDER.indexOf(crop.status as any);
  const isLocked = crop.isLocked || crop.status === 'harvested' || crop.status === 'completed';
  const harvestOverdue = crop.expectedHarvestDate && new Date(crop.expectedHarvestDate) < new Date() && crop.status !== 'harvested' && crop.status !== 'completed';

  const advanceStatus = async () => {
    if (isLocked || currentIdx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];

    if (nextStatus === 'harvested') {
      if (!harvestDate) {
        Alert.alert('Error', 'Please enter harvest date');
        return;
      }
      if (new Date(harvestDate) <= new Date(crop.sowingDate)) {
        Alert.alert('Error', 'Harvest date must be after sowing date');
        return;
      }
      await updateCrop(plotId, cropId, {
        status: 'harvested',
        actualHarvestDate: harvestDate,
        actualYield: parseFloat(actualYield) || undefined,
        actualYieldUnit: yieldUnit,
      });
    } else {
      await updateCrop(plotId, cropId, { status: nextStatus });
    }
  };

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>{crop.cropType}</Text>
        <Text style={{ color: colors.mutedFg, marginBottom: 16 }}>{crop.variety}</Text>

        {isLocked && (
          <View style={[styles.lockedBanner, { backgroundColor: colors.warning + '20', borderRadius: colors.radius }]}>
            <Text style={{ color: colors.warning, fontWeight: '600' }}>🔒 {t('cropLocked')}</Text>
          </View>
        )}

        {harvestOverdue && !isLocked && (
          <View style={[styles.alertBanner, { backgroundColor: colors.warning + '20', borderRadius: colors.radius }]}>
            <Text style={{ color: colors.warning, fontWeight: '600' }}>{t('harvestReminder')}</Text>
          </View>
        )}

        <Card style={{ marginBottom: 12 }}>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('area')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{crop.area} {crop.areaUnit}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('season')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{t(crop.season)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedFg }}>{t('sowingDate')}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{crop.sowingDate}</Text>
          </View>
          {crop.expectedHarvestDate && (
            <View style={styles.detailRow}>
              <Text style={{ color: colors.mutedFg }}>{t('expectedHarvest')}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{crop.expectedHarvestDate}</Text>
            </View>
          )}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('cropStatus')}</Text>
          <View style={styles.statusTimeline}>
            {STATUS_ORDER.map((status, idx) => {
              const isComplete = idx <= currentIdx;
              const isActive = idx === currentIdx;
              return (
                <View key={status} style={styles.statusItem}>
                  <View style={[
                    styles.statusDot,
                    {
                      backgroundColor: isComplete ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: isActive ? 3 : 0,
                    },
                  ]} />
                  <Text style={[styles.statusLabel, { color: isComplete ? colors.primary : colors.mutedFg }]}>
                    {t(status)}
                  </Text>
                  {idx < STATUS_ORDER.length - 1 && (
                    <View style={[styles.statusLine, { backgroundColor: isComplete ? colors.primary : colors.muted }]} />
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        {!isLocked && currentIdx < STATUS_ORDER.length - 1 && (
          <Card>
            {STATUS_ORDER[currentIdx + 1] === 'harvested' && (
              <>
                <DatePickerInput
                  label={t('actualHarvest')}
                  value={harvestDate}
                  onChange={setHarvestDate}
                />
                <Input
                  label={t('actualYield')}
                  placeholder="0"
                  value={actualYield}
                  onChangeText={setActualYield}
                  keyboardType="numeric"
                />
              </>
            )}
            <Button
              title={`Advance to ${t(STATUS_ORDER[currentIdx + 1])}`}
              onPress={advanceStatus}
              fullWidth
            />
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  lockedBanner: { padding: 12, marginBottom: 12 },
  alertBanner: { padding: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statusTimeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusItem: { alignItems: 'center', flex: 1 },
  statusDot: { width: 28, height: 28, borderRadius: 14 },
  statusLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  statusLine: { position: 'absolute', top: 14, left: '60%', right: '-40%', height: 2 },
});
