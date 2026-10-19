import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { usePlotStore } from '../../../shared/hooks/usePlotStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AddPlotModal } from '../components/AddPlotModal';

export function PlotListScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { plots, fetchPlots } = usePlotStore();
  const [addVisible, setAddVisible] = useState(false);

  useEffect(() => {
    fetchPlots();
  }, []);

  const soilLabel = (type: string) => {
    const labels: Record<string, string> = { black: t('black'), medium: t('medium'), light: t('light') };
    return labels[type] || type;
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('plots')}</Text>
        <Button title={t('addPlot')} onPress={() => setAddVisible(true)} size="sm" />
      </View>

      <FlatList
        data={plots}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>
        }
        renderItem={({ item: plot }) => (
          <TouchableOpacity onPress={() => navigation.navigate('PlotDashboard', { plotId: plot.id })}>
            <Card style={{ marginBottom: 10 }}>
              <Text style={[styles.plotName, { color: colors.foreground }]}>{plot.name}</Text>
              <View style={styles.plotMeta}>
                <Badge text={`${t('gatNumber')}: ${plot.gatNumber}`} />
                <Badge text={`${plot.area} ${t(plot.areaUnit)}`} variant="info" />
                <Badge text={soilLabel(plot.soilType)} variant="success" />
              </View>
              <Text style={{ color: colors.mutedFg, fontSize: 12, marginTop: 6 }}>
                {plot.irrigationType} • {t(plot.waterAvailability)}
              </Text>
              {plot.geoLocation && (
                <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>
                  📍 {plot.geoLocation.lat.toFixed(4)}, {plot.geoLocation.lng.toFixed(4)}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />

      <AddPlotModal visible={addVisible} onClose={() => { setAddVisible(false); fetchPlots(); }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  plotName: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  plotMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
});
