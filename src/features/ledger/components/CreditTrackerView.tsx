import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { isOverdue } from '../../../shared/utils/helpers';
import type { PaymentMode } from '../../../shared/types/ledger';

export function CreditTrackerView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions, recordCreditPayment } = useLedgerStore();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('cash');

  const creditTxns = transactions.filter((tx) => tx.paymentMode === 'credit' && (tx.pendingAmount ?? 0) > 0);
  const totalPending = creditTxns.reduce((s, t) => s + (t.pendingAmount || 0), 0);
  const totalCredit = transactions.filter((tx) => tx.paymentMode === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalPaid = totalCredit - totalPending;

  const handlePay = async (txnId: string, maxAmount: number) => {
    const amt = parseFloat(payAmount || '0');
    if (amt <= 0 || amt > maxAmount) {
      Alert.alert('Error', `Amount must be between 1 and ${maxAmount}`);
      return;
    }
    await recordCreditPayment(txnId, { amount: amt, date: new Date().toISOString().split('T')[0], paymentMode: payMode });
    setPayingId(null);
    setPayAmount('');
  };

  return (
    <FlatList
      data={creditTxns}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard} padding={12}>
            <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('totalPendingDue')}</Text>
            <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '700' }}>₹{totalPending.toLocaleString('en-IN')}</Text>
          </Card>
          <Card style={styles.kpiCard} padding={12}>
            <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('totalCreditTaken')}</Text>
            <Text style={{ color: colors.warning, fontSize: 18, fontWeight: '700' }}>₹{totalCredit.toLocaleString('en-IN')}</Text>
          </Card>
          <Card style={styles.kpiCard} padding={12}>
            <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('totalPaidBack')}</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>₹{totalPaid.toLocaleString('en-IN')}</Text>
            {totalCredit > 0 && <Text style={{ color: colors.mutedFg, fontSize: 10 }}>{((totalPaid / totalCredit) * 100).toFixed(0)}%</Text>}
          </Card>
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>
      }
      renderItem={({ item: txn }) => {
        const overdue = isOverdue(txn.dueDate, txn.pendingAmount);
        return (
          <Card style={{ marginTop: 8 }} padding={12}>
            <View style={styles.txnRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{txn.category}</Text>
                <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{txn.partyName || '—'} • {txn.date}</Text>
                {txn.dueDate && <Text style={{ color: colors.mutedFg, fontSize: 11 }}>{t('dueDate')}: {txn.dueDate}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.destructive, fontWeight: '700' }}>₹{(txn.pendingAmount || 0).toLocaleString('en-IN')}</Text>
                <Badge
                  text={overdue ? t('overdue') : t('pending')}
                  variant={overdue ? 'destructive' : 'warning'}
                />
              </View>
            </View>

            {(txn.payments || []).length > 0 && (
              <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 6 }}>
                <Text style={{ color: colors.mutedFg, fontSize: 11, fontWeight: '600' }}>{t('paymentHistory')}</Text>
                {txn.payments!.map((p) => (
                  <Text key={p.id} style={{ color: colors.mutedFg, fontSize: 11 }}>
                    {p.date}: ₹{p.amount} ({p.paymentMode})
                  </Text>
                ))}
              </View>
            )}

            {payingId === txn.id ? (
              <View style={{ marginTop: 10 }}>
                <Input
                  placeholder={`Max: ₹${txn.pendingAmount}`}
                  value={payAmount}
                  onChangeText={(v) => setPayAmount(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title={t('cancel')} onPress={() => setPayingId(null)} variant="outline" size="sm" style={{ flex: 1 }} />
                  <Button title={t('save')} onPress={() => handlePay(txn.id, txn.pendingAmount || 0)} size="sm" style={{ flex: 1 }} />
                </View>
              </View>
            ) : (
              <Button title={t('recordPayment')} onPress={() => setPayingId(txn.id)} variant="outline" size="sm" style={{ marginTop: 8 }} />
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 },
  kpiCard: { flex: 1 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
