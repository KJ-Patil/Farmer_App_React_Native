import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';

const DIRECT_COST_CATEGORIES = ['Seeds', 'Fertilizers', 'Pesticides', 'Labor', 'Weeding', 'Tractor', 'Irrigation', 'Transport', 'Packing', 'Market Cost', 'Hamali', 'Harvesting', 'Fodder', 'Medicines', 'Veterinary', 'Milk Collection', 'Dairy Labor'];

type PeriodTab = 'daily' | 'monthly' | 'yearly' | 'fy' | 'plotWise' | 'cropWise' | 'dairy' | 'overall';

export function ProfitLossView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useLedgerStore();
  const [period, setPeriod] = useState<PeriodTab>('overall');

  const periods: { key: PeriodTab; label: string }[] = [
    { key: 'daily', label: t('daily') },
    { key: 'monthly', label: t('monthlyPeriod') },
    { key: 'yearly', label: t('yearlyPeriod') },
    { key: 'fy', label: t('financialYear') },
    { key: 'plotWise', label: t('plotWise') },
    { key: 'cropWise', label: t('cropWise') },
    { key: 'dairy', label: t('dairy') },
    { key: 'overall', label: t('overall') },
  ];

  const pnl = useMemo(() => {
    let filteredTxns = transactions;

    if (period === 'dairy') {
      filteredTxns = transactions.filter((tx) => tx.ledgerType === 'dairy');
    }

    const income = filteredTxns.filter((tx) => tx.type === 'income');
    const expenses = filteredTxns.filter((tx) => tx.type === 'expense');

    const cropSales = income.filter((tx) => tx.incomeCategory === 'crop_sale').reduce((s, tx) => s + tx.amount, 0);
    const dairyIncome = income.filter((tx) => tx.incomeCategory === 'dairy').reduce((s, tx) => s + tx.amount, 0);
    const otherIncome = income.filter((tx) => tx.incomeCategory === 'other').reduce((s, tx) => s + tx.amount, 0);
    const totalRevenue = cropSales + dairyIncome + otherIncome;

    const directCosts = expenses.filter((tx) => DIRECT_COST_CATEGORIES.some((c) => tx.category?.includes(c))).reduce((s, tx) => s + tx.amount, 0);
    const grossProfit = totalRevenue - directCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const indirectCosts = expenses.reduce((s, tx) => s + tx.amount, 0) - directCosts;
    const netProfit = grossProfit - indirectCosts;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { cropSales, dairyIncome, otherIncome, totalRevenue, directCosts, grossProfit, grossMargin, indirectCosts, netProfit, netMargin };
  }, [transactions, period]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.periodChip, { backgroundColor: period === p.key ? colors.primary + '15' : colors.card, borderColor: period === p.key ? colors.primary : colors.border, borderRadius: 8 }]}
          >
            <Text style={{ color: period === p.key ? colors.primary : colors.foreground, fontWeight: '600', fontSize: 12 }}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Card>
        <Text style={[styles.heading, { color: colors.primary }]}>A. {t('totalRevenue')}</Text>
        <View style={styles.row}><Text style={{ color: colors.mutedFg }}>{t('cropSale')}</Text><Text style={{ color: colors.foreground }}>{fmt(pnl.cropSales)}</Text></View>
        <View style={styles.row}><Text style={{ color: colors.mutedFg }}>{t('dairyIncome')}</Text><Text style={{ color: colors.foreground }}>{fmt(pnl.dairyIncome)}</Text></View>
        <View style={styles.row}><Text style={{ color: colors.mutedFg }}>{t('otherIncome')}</Text><Text style={{ color: colors.foreground }}>{fmt(pnl.otherIncome)}</Text></View>
        <View style={[styles.row, styles.totalRow]}><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('totalRevenue')}</Text><Text style={{ color: colors.primary, fontWeight: '700' }}>{fmt(pnl.totalRevenue)}</Text></View>
      </Card>

      <Card style={{ marginTop: 10 }}>
        <Text style={[styles.heading, { color: colors.destructive }]}>B. {t('directCosts')}</Text>
        <View style={[styles.row, styles.totalRow]}><Text style={{ color: colors.destructive, fontWeight: '700' }}>Total Direct Costs</Text><Text style={{ color: colors.destructive, fontWeight: '700' }}>{fmt(pnl.directCosts)}</Text></View>
      </Card>

      <Card style={{ marginTop: 10 }}>
        <Text style={[styles.heading, { color: colors.info }]}>C. {t('grossProfit')}</Text>
        <View style={styles.row}><Text style={{ color: colors.foreground, fontWeight: '700' }}>{t('grossProfit')}</Text><Text style={{ color: pnl.grossProfit >= 0 ? colors.primary : colors.destructive, fontWeight: '700' }}>{fmt(pnl.grossProfit)}</Text></View>
        <View style={styles.row}><Text style={{ color: colors.mutedFg }}>{t('grossMargin')}</Text><Text style={{ color: colors.mutedFg }}>{pnl.grossMargin.toFixed(1)}%</Text></View>
      </Card>

      <Card style={{ marginTop: 10 }}>
        <Text style={[styles.heading, { color: colors.warning }]}>D. {t('indirectCosts')}</Text>
        <View style={[styles.row, styles.totalRow]}><Text style={{ color: colors.warning, fontWeight: '700' }}>Total Indirect</Text><Text style={{ color: colors.warning, fontWeight: '700' }}>{fmt(pnl.indirectCosts)}</Text></View>
      </Card>

      <Card style={{ marginTop: 10, borderWidth: 2, borderColor: pnl.netProfit >= 0 ? colors.primary : colors.destructive }}>
        <Text style={[styles.heading, { color: pnl.netProfit >= 0 ? colors.primary : colors.destructive }]}>E. {t('netFarmProfit')}</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 18 }}>{t('netFarmProfit')}</Text>
          <Text style={{ color: pnl.netProfit >= 0 ? colors.primary : colors.destructive, fontWeight: '700', fontSize: 18 }}>{fmt(pnl.netProfit)}</Text>
        </View>
        <View style={styles.row}><Text style={{ color: colors.mutedFg }}>{t('netMargin')}</Text><Text style={{ color: colors.mutedFg }}>{pnl.netMargin.toFixed(1)}%</Text></View>
        <Text style={{ color: colors.mutedFg, fontSize: 10, marginTop: 8 }}>Generated: {new Date().toISOString()}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  periodChip: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8 },
  heading: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E5E5', marginTop: 6, paddingTop: 8 },
});
