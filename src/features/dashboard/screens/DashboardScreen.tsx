import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { AreaChart } from '../../../components/ui/AreaChart';

export function DashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { transactions, fetchTransactions } = useLedgerStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const pending = transactions.filter((t) => t.paymentMode === 'credit' && (t.pendingAmount || 0) > 0).reduce((s, t) => s + (t.pendingAmount || 0), 0);
    return { income, expenses, netProfit: income - expenses, pending };
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxns = transactions.filter((tx) => tx.date?.startsWith(key));
      result.push({
        label: months[d.getMonth()],
        income: monthTxns.filter((tx) => tx.type === 'income').reduce((s, tx) => s + (tx.amount || 0), 0),
        expense: monthTxns.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0),
      });
    }
    return result;
  }, [transactions]);

  const recentTxns = transactions.slice(0, 5);

  const kpiCards = [
    { label: t('totalIncome'), value: stats.income, color: colors.primary },
    { label: t('totalExpenses'), value: stats.expenses, color: colors.destructive },
    { label: t('netProfit'), value: stats.netProfit, color: colors.info },
    { label: t('pendingCredit'), value: stats.pending, color: colors.warning },
  ];

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>{t('dashboard')}</Text>

        <View style={styles.kpiGrid}>
          {kpiCards.map((kpi, i) => (
            <Card key={i} style={styles.kpiCard} padding={14}>
              <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>{kpi.label}</Text>
              <Text style={[styles.kpiValue, { color: kpi.color }]}>{formatCurrency(kpi.value)}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginTop: 16, marginBottom: 16 }} padding={16}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('incomeVsExpenses')}</Text>
          <Text style={[styles.chartPlaceholder, { color: colors.mutedFg }]}>{t('last6Months')}</Text>
          <View style={{ alignItems: 'center' }}>
            <AreaChart data={chartData} width={screenWidth - 64} height={160} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 3, backgroundColor: colors.primary, borderRadius: 2 }} />
              <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('income')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 3, backgroundColor: colors.destructive, borderRadius: 2 }} />
              <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('expenses')}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('recentTransactions')}</Text>
        </View>

        {recentTxns.length === 0 ? (
          <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 20 }}>{t('noData')}</Text>
        ) : (
          recentTxns.map((txn) => (
            <Card key={txn.id} style={{ marginBottom: 8 }} padding={12}>
              <View style={styles.txnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txnCategory, { color: colors.foreground }]}>{txn.category}</Text>
                  <Text style={[styles.txnDate, { color: colors.mutedFg }]}>{txn.date}</Text>
                  {txn.partyName && <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{txn.partyName}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txnAmount,
                      { color: txn.type === 'income' ? colors.primary : colors.destructive },
                    ]}
                  >
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  <Badge text={txn.paymentMode?.toUpperCase() || 'CASH'} variant={txn.type === 'income' ? 'success' : 'destructive'} />
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('LedgerTab')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '48%', flexGrow: 1 },
  kpiLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartPlaceholder: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  chartArea: { height: 160, justifyContent: 'center', alignItems: 'center' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txnCategory: { fontSize: 14, fontWeight: '600' },
  txnDate: { fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
