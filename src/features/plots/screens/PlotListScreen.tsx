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
import { Layers, Droplets, Sparkles, Plus } from 'lucide-react-native';

export function PlotListScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { plots, fetchPlots, isLoading } = usePlotStore();
  const [addVisible, setAddVisible] = useState(false);

  useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('plots')}</Text>
        </View>
        <Button
          title={t('addPlot')}
          onPress={() => setAddVisible(true)}
          size="sm"
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={plots}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshing={isLoading}
        onRefresh={fetchPlots}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.mutedFg, textAlign: 'center', fontSize: 14 }}>
              {t('noData')}
            </Text>
          </View>
        }
        renderItem={({ item: plot }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PlotDashboard', { plotId: plot.id })}
            activeOpacity={0.8}
          >
            <Card style={styles.plotCard} padding={16}>
              <View style={styles.plotCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.plotName, { color: colors.foreground }]}>
                    {plot.name || `${t('plots')} #${plot.gatNumber}`}
                  </Text>
                  <Text style={[styles.plotAreaSub, { color: colors.primary }]}>
                    {plot.name ? `${t('gatNumber')}: ${plot.gatNumber} | ` : ''}
                    {plot.area} {t(plot.areaUnit || 'acre')}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Layers color="#F59E0B" size={14} />
                  <Text style={[styles.metaLabel, { color: colors.mutedFg }]}>{t('soilType')}:</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {t(plot.soilType) || plot.soilType}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Droplets color="#3B82F6" size={14} />
                  <Text style={[styles.metaLabel, { color: colors.mutedFg }]}>{t('irrigationType')}:</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {t(plot.irrigationType) || plot.irrigationType}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Sparkles color="#10B981" size={14} />
                  <Text style={[styles.metaLabel, { color: colors.mutedFg }]}>{t('waterAvailability')}:</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {t(plot.waterAvailability) || plot.waterAvailability}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <AddPlotModal visible={addVisible} onClose={() => { setAddVisible(false); fetchPlots(); }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  addBtn: { minWidth: 100 },
  plotCard: { marginBottom: 12 },
  plotCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  plotName: { fontSize: 16, fontWeight: '700' },
  plotAreaSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  divider: { height: 1, marginVertical: 12 },
  metaRow: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: 12 },
  metaValue: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { paddingVertical: 48, alignItems: 'center' },
});
