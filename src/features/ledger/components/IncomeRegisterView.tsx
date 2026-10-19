import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function IncomeRegisterView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useLedgerStore();

  const incomeTxns = transactions.filter((tx) => tx.type === 'income');

  const stats = useMemo(() => {
    const total = incomeTxns.reduce((s, tx) => s + tx.amount, 0);
    const cropSales = incomeTxns.filter((tx) => tx.incomeCategory === 'crop_sale').reduce((s, tx) => s + tx.amount, 0);
    const dairy = incomeTxns.filter((tx) => tx.incomeCategory === 'dairy').reduce((s, tx) => s + tx.amount, 0);
    const loans = incomeTxns.filter((tx) => tx.incomeCategory === 'loan').reduce((s, tx) => s + tx.amount, 0);
    const other = incomeTxns.filter((tx) => tx.incomeCategory === 'other').reduce((s, tx) => s + tx.amount, 0);
    return { total, cropSales, dairy, loans, other };
  }, [incomeTxns]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  const kpis = [
    { label: t('totalIncome'), value: stats.total, color: colors.primary },
    { label: t('cropSale'), value: stats.cropSales, color: colors.primary },
    { label: t('dairyIncome'), value: stats.dairy, color: colors.info },
    { label: t('loanReceived'), value: stats.loans, color: colors.warning },
    { label: t('otherIncome'), value: stats.other, color: '#8B5CF6' },
  ];

  // Upcoming loan EMIs
  const loanTxns = incomeTxns.filter((tx) => tx.incomeCategory === 'loan' && tx.loanDetails);

  return (
    <FlatList
      data={incomeTxns}
      keyExtractor={(tx) => tx.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {kpis.map((kpi, i) => (
              <Card key={i} style={{ marginRight: 8, width: 130 }} padding={12}>
                <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{kpi.label}</Text>
                <Text style={{ color: kpi.color, fontSize: 17, fontWeight: '700' }}>{fmt(kpi.value)}</Text>
              </Card>
            ))}
          </ScrollView>

          {loanTxns.length > 0 && (
            <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 4 }}>Loan EMI Reminders</Text>
              {loanTxns.slice(0, 3).map((tx) => (
                <View key={tx.id} style={styles.emiRow}>
                  <Text style={{ color: colors.mutedFg, fontSize: 12 }}>
                    {tx.loanDetails?.loanType} — {tx.loanDetails?.emiFrequency} EMI
                  </Text>
                  <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>
                    Next: {tx.loanDetails?.firstInstallmentDate || '—'}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>
      }
      renderItem={({ item: tx }) => (
        <Card style={{ marginTop: 6 }} padding={12}>
          <View style={styles.txnRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>{tx.category}</Text>
              <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{tx.date} {tx.partyName ? `• ${tx.partyName}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>+{fmt(tx.amount)}</Text>
              <Badge text={tx.paymentMode?.toUpperCase() || 'CASH'} variant="success" />
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
});
