import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { usePlotStore } from '../../../shared/hooks/usePlotStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';

interface AddCropModalProps {
  visible: boolean;
  onClose: () => void;
  plotId: string;
}

const CROP_PRESETS = ['rice', 'wheat', 'sugarcane', 'soybean', 'cotton', 'onion', 'tomato', 'grapes', 'pomegranate', 'banana', 'custom'] as const;
const SEASONS = ['kharif', 'rabi', 'zaid'] as const;
const AREA_UNITS = ['acre', 'hectare', 'guntha'] as const;

export function AddCropModal({ visible, onClose, plotId }: AddCropModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { createCrop, getPlotRemainingArea } = usePlotStore();

  const remaining = getPlotRemainingArea(plotId);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cropType: '',
    customCropType: '',
    variety: '',
    area: '',
    areaUnit: 'acre' as string,
    season: 'kharif' as string,
    sowingDate: '',
    expectedHarvestDate: '',
    estimatedYield: '',
    estimatedYieldUnit: 'Quintal',
  });

  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const cropType = form.cropType === 'custom' ? form.customCropType : form.cropType;
    if (!cropType.trim()) { Alert.alert(t('error'), t('selectCropType')); return; }
    if (!form.variety.trim()) { Alert.alert(t('error'), t('varietyRequired')); return; }

    const area = parseFloat(form.area);
    if (!area || area <= 0) { Alert.alert(t('error'), t('validAreaRequired')); return; }
    if (area > remaining) { Alert.alert(t('error'), t('areaExceedsRemaining', { remaining: remaining.toFixed(2) })); return; }
    if (!form.sowingDate.trim()) { Alert.alert(t('error'), t('sowingDateRequired')); return; }

    setLoading(true);
    try {
      await createCrop(plotId, {
        cropType,
        variety: form.variety.trim(),
        area,
        areaUnit: form.areaUnit,
        season: form.season as any,
        sowingDate: form.sowingDate,
        expectedHarvestDate: form.expectedHarvestDate || undefined,
        estimatedYield: form.estimatedYield ? parseFloat(form.estimatedYield) : undefined,
        estimatedYieldUnit: form.estimatedYieldUnit || undefined,
        status: 'sown',
      });
      onClose();
    } catch (err: any) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('addCrop')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={{ color: colors.mutedFg, fontSize: 13, marginBottom: 16 }}>
            {t('remainingArea')}: {remaining.toFixed(2)}
          </Text>

          <Text style={[styles.label, { color: colors.foreground }]}>{t('cropType')}</Text>
          <View style={styles.chipGrid}>
            {CROP_PRESETS.map((crop) => (
              <TouchableOpacity
                key={crop}
                onPress={() => updateForm('cropType', crop)}
                style={[
                  styles.chip,
                  {
                    borderColor: form.cropType === crop ? colors.primary : colors.border,
                    backgroundColor: form.cropType === crop ? colors.primary + '15' : colors.card,
                    borderRadius: 8,
                  },
                ]}
              >
                <Text style={{ color: form.cropType === crop ? colors.primary : colors.foreground, fontWeight: '600', fontSize: 13 }}>
                  {t(crop)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.cropType === 'custom' && (
            <Input label={t('cropType')} value={form.customCropType} onChangeText={(v) => updateForm('customCropType', v)} placeholder={t('enterCropName')} />
          )}

          <Input label={t('variety')} value={form.variety} onChangeText={(v) => updateForm('variety', v)} placeholder={t('varietyPlaceholder')} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Input label={t('area')} value={form.area} onChangeText={(v) => updateForm('area', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('unit')}</Text>
              <View style={styles.chipGrid}>
                {AREA_UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => updateForm('areaUnit', u)}
                    style={[styles.miniChip, { borderColor: form.areaUnit === u ? colors.primary : colors.border, backgroundColor: form.areaUnit === u ? colors.primary + '15' : colors.card, borderRadius: 6 }]}
                  >
                    <Text style={{ color: form.areaUnit === u ? colors.primary : colors.foreground, fontSize: 11, fontWeight: '600' }}>{t(u)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>{t('season')}</Text>
          <View style={styles.chipGrid}>
            {SEASONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateForm('season', s)}
                style={[styles.chip, { borderColor: form.season === s ? colors.primary : colors.border, backgroundColor: form.season === s ? colors.primary + '15' : colors.card, borderRadius: 8 }]}
              >
                <Text style={{ color: form.season === s ? colors.primary : colors.foreground, fontWeight: '600', fontSize: 13 }}>{t(s)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <DatePickerInput label={t('sowingDate')} value={form.sowingDate} onChange={(v) => updateForm('sowingDate', v)} />
          <DatePickerInput label={t('expectedHarvest')} value={form.expectedHarvestDate} onChange={(v) => updateForm('expectedHarvestDate', v)} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Input label={t('estimatedYield')} value={form.estimatedYield} onChangeText={(v) => updateForm('estimatedYield', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder={t('optional')} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label={t('unit')} value={form.estimatedYieldUnit} onChangeText={(v) => updateForm('estimatedYieldUnit', v)} />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button title={t('save')} onPress={handleSave} loading={loading} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14 },
  miniChip: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  footer: { padding: 16, borderTopWidth: 1 },
});
