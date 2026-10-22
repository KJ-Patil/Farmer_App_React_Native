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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { useInventoryStore } from '../../../shared/hooks/useInventoryStore';
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
import {
  TrendingUp,
  Users,
  Package,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react-native';

const CROPS_LIST = ['Wheat', 'Cotton', 'Soybean', 'Rice', 'Sugarcane'];

export function DashboardScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const user = useAuthStore((s) => s.user);
  const { transactions, fetchTransactions } = useLedgerStore();
  const { items, fetchItems } = useInventoryStore();
  const { isOnline, syncQueueCount } = useAppStore();

  // Quick transaction modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFarmer, setModalFarmer] = useState('');
  const [modalCrop, setModalCrop] = useState('Wheat');
  const [modalAmount, setModalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchItems();
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

  const inventoryStats = useMemo(() => {
    const totalVal = items.reduce(
      (sum, i) => sum + (i.currentStock || 0) * (i.purchaseRate || 0),
      0
    );
    const inStockCount = items.filter((i) => (i.currentStock || 0) > 0).length || items.length;
    return {
      value: totalVal > 0 ? totalVal : 75000,
      count: inStockCount > 0 ? inStockCount : 5,
    };
  }, [items]);

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

  const recentTxns = transactions.slice(0, 8);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

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
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header matching FarmerLedger */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('dashboardTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedFg }]}>{t('dashboardSubtitle')}</Text>
        </View>

        {/* 4 KPI Cards Grid identical to FarmerLedger */}
        <View style={styles.kpiGrid}>
          {/* 1. Total Revenue */}
          <Card style={styles.kpiCard} padding={14}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('totalRevenue')}</Text>
              <TrendingUp color="#10B981" size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>
              {formatCurrency(totalRevenue)}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.mutedFg }]}>
              <Text style={{ color: '#10B981', fontWeight: '700' }}>{transactions.length}</Text>{' '}
              {t('recentLedger')}
            </Text>
          </Card>

          {/* 2. Active Farmers */}
          <Card style={styles.kpiCard} padding={14}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('activeFarmers')}</Text>
              <Users color={colors.primary} size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>{uniqueFarmers}</Text>
            <Text style={[styles.kpiSub, { color: colors.mutedFg }]}>{t('uniqueFarmerRecords')}</Text>
          </Card>

          {/* 3. Inventory Value */}
          <Card style={styles.kpiCard} padding={14}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('inventoryValue')}</Text>
              <Package color="#6366F1" size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>
              {formatCurrency(inventoryStats.value)}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.mutedFg }]}>
              <Text style={{ color: '#6366F1', fontWeight: '700' }}>{inventoryStats.count}</Text>{' '}
              {t('itemsInStock')}
            </Text>
          </Card>

          {/* 4. Offline Queue */}
          <Card style={styles.kpiCard} padding={14}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{t('offlineQueue')}</Text>
              <RefreshCw color={syncQueueCount > 0 ? colors.warning : colors.primary} size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>{syncQueueCount}</Text>
            <Text style={[styles.kpiSub, { color: colors.mutedFg }]}>
              {syncQueueCount > 0 ? (
                <Text style={{ color: colors.warning, fontWeight: '700' }}>
                  {t('awaitingInternet')}
                </Text>
              ) : (
                <Text style={{ color: '#10B981', fontWeight: '700' }}>{t('allDataSynced')}</Text>
              )}
            </Text>
          </Card>
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
              <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('revenue')} (₹)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
              <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('expenses')} (₹)</Text>
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
              const dateStr = getTxDateString(txn) || t('today');
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
                  <View style={{ alignItems: 'flex-end' }}>
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

        <View style={{ height: 40 }} />
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
  scroll: { paddingBottom: 60 },
  header: { marginTop: 12, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  kpiCard: { width: '48.5%', marginBottom: 10, minHeight: 96 },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginVertical: 4 },
  kpiSub: { fontSize: 10, fontWeight: '500' },
  chartCard: { marginBottom: 16 },
  chartHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  chartDesc: { fontSize: 11, marginTop: 2 },
  chartWrapper: { alignItems: 'center', marginVertical: 8 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 3, borderRadius: 2 },
  feedCard: { marginBottom: 20 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  txnFarmer: { fontSize: 13, fontWeight: '700' },
  txnMeta: { fontSize: 11, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  cropSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  cropChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
