import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  useWindowDimensions,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { useAppStore } from '../../../shared/hooks/useAppStore';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { db } from '../../../shared/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { AreaChart } from '../../../components/ui/AreaChart';
import { fmtDMY } from '../../../shared/utils/helpers';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  TrendingUp,
  Users,
  RefreshCw,
  Plus,
  X,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;
const WAVE_HEIGHT = 220;

const CROPS_LIST = ['Wheat', 'Cotton', 'Soybean', 'Rice', 'Sugarcane'];

export function DashboardScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const user = useAuthStore((s) => s.user);
  const { transactions, fetchTransactions } = useLedgerStore();
  const { isOnline, syncQueueCount } = useAppStore();

  // Quick transaction modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFarmer, setModalFarmer] = useState('');
  const [modalCrop, setModalCrop] = useState('Wheat');
  const [modalAmount, setModalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Compute metrics identical to FarmerLedger
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  }, [transactions]);

  const uniqueFarmers = useMemo(() => {
    const names = transactions
      .map((tx) => tx.partyName)
      .filter((n): n is string => Boolean(n && n.trim()));
    return new Set(names).size || (transactions.length > 0 ? 1 : 0);
  }, [transactions]);

  // Aggregate monthly trend data from transactions for the AreaChart
  const getTxDateString = (tx: any): string => {
    if (typeof tx.date === 'string') return tx.date;
    if (typeof tx.timestamp === 'string') return tx.timestamp.split('T')[0];
    if (tx.timestamp && typeof tx.timestamp.toDate === 'function') {
      return tx.timestamp.toDate().toISOString().split('T')[0];
    }
    return '';
  };

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxns = transactions.filter((tx) => getTxDateString(tx).startsWith(key));
      const inc = monthTxns
        .filter((tx) => tx.type === 'income' || !tx.type)
        .reduce((s, tx) => s + (tx.amount || 0), 0);
      const exp = monthTxns
        .filter((tx) => tx.type === 'expense')
        .reduce((s, tx) => s + (tx.amount || 0), 0);

      result.push({
        label: months[d.getMonth()],
        income: inc,
        expense: exp,
      });
    }
    return result;
  }, [transactions]);

  const recentTxns = transactions.slice(0, 5);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('goodMorning'), Icon: Sun, iconColor: '#FDE047' };
    if (hour < 17) return { text: t('goodAfternoon'), Icon: Sunset, iconColor: '#FB923C' };
    return { text: t('goodEvening'), Icon: Moon, iconColor: '#E2E8F0' };
  };

  const greeting = getGreeting();
  const firstName = user?.fullName?.split(' ')[0] || '';

  const todayFormatted = new Date().toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleAddTransaction = async () => {
    if (!modalFarmer.trim() || !modalAmount.trim()) {
      Alert.alert(t('required'), t('enterFarmerNameAndAmount'));
      return;
    }
    const amt = parseFloat(modalAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t('invalid'), t('enterValidPositiveAmount'));
      return;
    }

    setSubmitting(true);
    try {
      const userMobile = user?.mobileNumber || '9130057189';
      const newTxData = {
        farmer: modalFarmer.trim(),
        crop: modalCrop,
        amount: amt,
        timestamp: new Date().toISOString(),
      };

      const txsRef = collection(db, 'users', userMobile, 'transactions');
      await addDoc(txsRef, newTxData);

      setModalFarmer('');
      setModalAmount('');
      setModalOpen(false);
      await fetchTransactions();
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('failedToSaveTransaction'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout noPadding noTopInset>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Wave Header */}
        <View style={styles.waveContainer}>
          <Svg width={SCREEN_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${SCREEN_WIDTH} ${WAVE_HEIGHT}`}>
            <Defs>
              <LinearGradient id="dashWaveGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#16A34A" />
                <Stop offset="1" stopColor="#0F766E" />
              </LinearGradient>
            </Defs>
            <Path
              d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},${WAVE_HEIGHT * 0.7} Q${SCREEN_WIDTH * 0.75},${WAVE_HEIGHT * 0.95} ${SCREEN_WIDTH * 0.5},${WAVE_HEIGHT * 0.82} Q${SCREEN_WIDTH * 0.25},${WAVE_HEIGHT * 0.68} 0,${WAVE_HEIGHT * 0.88} Z`}
              fill="url(#dashWaveGrad)"
            />
            <Path
              d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},${WAVE_HEIGHT * 0.6} Q${SCREEN_WIDTH * 0.65},${WAVE_HEIGHT * 0.85} ${SCREEN_WIDTH * 0.4},${WAVE_HEIGHT * 0.73} Q${SCREEN_WIDTH * 0.15},${WAVE_HEIGHT * 0.6} 0,${WAVE_HEIGHT * 0.78} Z`}
              fill="#22C55E"
              opacity={0.25}
            />
            <Path
              d={`M0,0 L${SCREEN_WIDTH},0 L${SCREEN_WIDTH},${WAVE_HEIGHT * 0.5} Q${SCREEN_WIDTH * 0.55},${WAVE_HEIGHT * 0.72} ${SCREEN_WIDTH * 0.3},${WAVE_HEIGHT * 0.6} Q${SCREEN_WIDTH * 0.1},${WAVE_HEIGHT * 0.5} 0,${WAVE_HEIGHT * 0.65} Z`}
              fill="#4ADE80"
              opacity={0.15}
            />
          </Svg>
          <View style={[styles.waveTextOverlay, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <View style={styles.greetingRow}>
              <greeting.Icon size={20} color={greeting.iconColor} />
              <Text style={styles.greetingText}>
                {greeting.text}{firstName ? `, ${firstName}` : ''}
              </Text>
            </View>
            <Text style={styles.waveDate}>{todayFormatted}</Text>

            <View style={styles.waveStatRow}>
              <View style={styles.waveStatItem}>
                <Text style={styles.waveStatValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.waveStatLabel}>{t('revenue')}</Text>
              </View>
              <View style={styles.waveStatDivider} />
              <View style={styles.waveStatItem}>
                <Text style={styles.waveStatValue}>{uniqueFarmers}</Text>
                <Text style={styles.waveStatLabel}>{t('farmers')}</Text>
              </View>
              <View style={styles.waveStatDivider} />
              <View style={styles.waveStatItem}>
                <Text style={styles.waveStatValue}>{transactions.length}</Text>
                <Text style={styles.waveStatLabel}>{t('entries')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentPadding}>

        {/* 4 KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('totalRevenue')}</Text>
              <TrendingUp color="#16A34A" size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>
              {formatCurrency(totalRevenue)}
            </Text>
            <Text style={[styles.kpiSub, { color: '#16A34A' }]}>
              {transactions.length} {t('recentLedger')}
            </Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('activeFarmers')}</Text>
              <Users color="#2563EB" size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>{uniqueFarmers}</Text>
            <Text style={[styles.kpiSub, { color: '#2563EB' }]}>{t('uniqueFarmerRecords')}</Text>
          </View>

          <View style={[styles.kpiCard, { width: '100%', backgroundColor: colors.card }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('offlineQueue')}</Text>
              <RefreshCw color={syncQueueCount > 0 ? '#D97706' : '#16A34A'} size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>{syncQueueCount}</Text>
            <Text style={[styles.kpiSub, { color: syncQueueCount > 0 ? '#D97706' : '#16A34A' }]}>
              {syncQueueCount > 0 ? t('awaitingInternet') : t('allDataSynced')}
            </Text>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        <Card style={styles.chartCard} padding={16}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('revenueTrend')}
            </Text>
            <Text style={[styles.chartDesc, { color: colors.mutedFg }]}>
              {t('revenueTrendDesc')}
            </Text>
          </View>
          <View style={styles.chartWrapper}>
            <AreaChart data={chartData} width={Math.min(screenWidth - 48, 640)} height={170} />
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{t('revenue')} (₹)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
              <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{t('expenses')} (₹)</Text>
            </View>
          </View>
        </Card>

        {/* Recent Ledger Feed matching FarmerLedger */}
        <Card style={styles.feedCard} padding={16}>
          <View style={styles.feedHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('recentLedger')}
              </Text>
              <Text style={[styles.chartDesc, { color: colors.mutedFg }]}>
                {t('realTimeJournal')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalOpen(true)}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Plus color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>

          {recentTxns.length === 0 ? (
            <Text style={{ color: colors.mutedFg, textAlign: 'center', marginVertical: 24 }}>
              {t('noData')}
            </Text>
          ) : (
            recentTxns.map((txn, index) => {
              const farmerTitle = txn.partyName || (txn as any).farmer || t('generalFarmer');
              const cropOrCategory = txn.category || (txn as any).crop || t('general');
              const dateStr = fmtDMY(getTxDateString(txn)) || t('today');
              return (
                <View
                  key={txn.id || index}
                  style={[
                    styles.txnRow,
                    { borderBottomColor: colors.border },
                    index === recentTxns.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txnFarmer, { color: colors.foreground }]}>
                      {farmerTitle}
                    </Text>
                    <Text style={[styles.txnMeta, { color: colors.mutedFg }]}>
                      {cropOrCategory} • {dateStr}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: txn.type === 'expense' ? colors.destructive : colors.primary },
                      ]}
                    >
                      {txn.type === 'expense' ? '-' : '+'}
                      {formatCurrency(txn.amount)}
                    </Text>
                    <Badge
                      text={(txn.paymentMode || 'CASH').toUpperCase()}
                      variant={txn.type === 'expense' ? 'destructive' : 'success'}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Quick Add Transaction Modal identical to FarmerLedger */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} padding={20}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t('addTransaction')}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X color={colors.mutedFg} size={20} />
              </TouchableOpacity>
            </View>

            <Input
              label={t('farmer')}
              placeholder={t('farmerNamePlaceholder')}
              value={modalFarmer}
              onChangeText={setModalFarmer}
            />

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('crop')}</Text>
            <View style={styles.cropSelector}>
              {CROPS_LIST.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setModalCrop(c)}
                  style={[
                    styles.cropChip,
                    {
                      borderColor: modalCrop === c ? colors.primary : colors.border,
                      backgroundColor: modalCrop === c ? colors.primary + '15' : colors.card,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: modalCrop === c ? colors.primary : colors.foreground,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {t(c.toLowerCase()) || c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t('amount')}
              placeholder={t('amountPlaceholder')}
              value={modalAmount}
              onChangeText={setModalAmount}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="outline"
                onPress={() => setModalOpen(false)}
                disabled={submitting}
                style={{ flex: 1 }}
              />
              <Button
                title={t('save')}
                onPress={handleAddTransaction}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  waveContainer: { position: 'relative', width: '100%', height: WAVE_HEIGHT },
  waveTextOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greetingText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  waveDate: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: '500' },
  waveStatRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6 },
  waveStatItem: { flex: 1, alignItems: 'center' },
  waveStatValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  waveStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  waveStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  contentPadding: { paddingHorizontal: 16, marginTop: -8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  kpiCard: { width: '48.5%' as any, marginBottom: 10, minHeight: 96, borderRadius: 24, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginVertical: 4, letterSpacing: -0.5 },
  kpiSub: { fontSize: 13, fontWeight: '600' },
  chartCard: { marginBottom: 16 },
  chartHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  chartDesc: { fontSize: 13, marginTop: 2 },
  chartWrapper: { alignItems: 'center', marginVertical: 8 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 3, borderRadius: 2 },
  feedCard: { marginBottom: 20 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  txnFarmer: { fontSize: 14, fontWeight: '700' },
  txnMeta: { fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  cropSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  cropChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
