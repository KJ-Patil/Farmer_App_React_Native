import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { isOverdue, fmtDMY } from '../../../shared/utils/helpers';
import type { Transaction, PaymentMode } from '../../../shared/types/ledger';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
} from 'lucide-react-native';

interface CreditTrackerViewProps {
  onOpenAddModal?: () => void;
}

export function CreditTrackerView({ onOpenAddModal }: CreditTrackerViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions, recordCreditPayment } = useLedgerStore();

  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [payNotes, setPayNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter all credit purchases (either paymentMode === 'credit' or has pendingAmount)
  const creditPurchases = useMemo(() => {
    return transactions.filter(
      (tx) => tx.paymentMode === 'credit' || (tx.pendingAmount !== undefined && tx.pendingAmount > 0)
    );
  }, [transactions]);

  const totalCreditTaken = creditPurchases.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const totalPendingDue = creditPurchases.reduce(
    (sum, tx) => sum + (tx.pendingAmount !== undefined ? tx.pendingAmount : tx.amount || 0),
    0
  );
  const totalPaidBack = Math.max(0, totalCreditTaken - totalPendingDue);
  const paidPercent = totalCreditTaken > 0 ? (totalPaidBack / totalCreditTaken) * 100 : 0;

  const handleSettleSubmit = async () => {
    if (!selectedTx || !payAmount || Number(payAmount) <= 0) {
      Alert.alert(t('required'), t('enterValidAmount'));
      return;
    }

    const numAmount = Number(payAmount);
    const maxPending = selectedTx.pendingAmount !== undefined ? selectedTx.pendingAmount : selectedTx.amount;
    if (numAmount > maxPending) {
      Alert.alert(
        t('invalid'),
        `${t('amountCannotExceedDue')} (₹${maxPending})`
      );
      return;
    }

    setLoading(true);
    try {
      await recordCreditPayment(selectedTx.id, {
        date: payDate,
        amount: numAmount,
        paymentMode: payMode,
        notes: payNotes || `${selectedTx.partyName || t('party')} - ${t('payInstallment')}`,
      });

      setSelectedTx(null);
      setPayAmount('');
      setPayNotes('');
      Alert.alert(t('success'), t('paymentRecordedSuccessfully'));
    } catch (err: any) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={creditPurchases}
        keyExtractor={(tx) => tx.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 8 }}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock color={colors.warning} size={18} />
                  <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                    {t('creditManagement')}
                  </Text>
                </View>
                <Text style={{ color: colors.mutedFg, fontSize: 13, marginTop: 2 }}>
                  {t('creditManagementSubtitle')}
                </Text>
              </View>

              {onOpenAddModal && (
                <Button
                  title={t('addCredit')}
                  onPress={onOpenAddModal}
                  size="sm"
                />
              )}
            </View>

            {/* 3 KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>
                  {t('totalPendingDue')}
                </Text>
                <Text style={[styles.kpiVal, { color: '#DC2626' }]}>
                  {fmt(totalPendingDue)}
                </Text>
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                  {creditPurchases.filter((tx) => (tx.pendingAmount ?? tx.amount) > 0).length}{' '}
                  {t('pendingBills')}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>
                  {t('totalCreditTaken')}
                </Text>
                <Text style={[styles.kpiVal, { color: '#D97706' }]}>
                  {fmt(totalCreditTaken)}
                </Text>
                <Text style={{ color: '#D97706', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                  {creditPurchases.length} {t('totalBills')}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedFg }]}>
                  {t('totalPaidBack')}
                </Text>
                <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{fmt(totalPaidBack)}</Text>
                <Text style={{ color: '#16A34A', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                  {paidPercent.toFixed(0)}% {t('cleared')}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 6 }}>
              {t('creditBills')} ({creditPurchases.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <CheckCircle2 color={colors.primary} size={36} />
            <Text style={{ color: colors.mutedFg, marginTop: 10, fontSize: 13, fontWeight: '600' }}>
              {t('noPendingCreditDues')}
            </Text>
          </View>
        }
        renderItem={({ item: tx }) => {
          const pending = tx.pendingAmount !== undefined ? tx.pendingAmount : tx.amount;
          const isSettled = pending <= 0;
          const overdue = !isSettled && isOverdue(tx.dueDate, pending);
          const isExpanded = expandedTxId === tx.id;
          const payments = tx.payments || [];

          return (
            <Card
              style={{
                marginTop: 8,
                borderColor: overdue ? colors.destructive + '60' : isSettled ? colors.primary + '40' : colors.border,
                backgroundColor: overdue ? colors.destructive + '05' : colors.card,
              }}
              padding={14}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {tx.partyName || tx.category}
                    </Text>
                    {tx.billNumber && <Badge text={`#${tx.billNumber}`} variant="default" />}
                  </View>

                  <Text style={{ color: colors.mutedFg, fontSize: 13, marginTop: 2 }}>
                    {tx.category} • {fmtDMY(tx.date)}
                    {tx.plotName ? ` • 📍 ${tx.plotName}` : ''}
                  </Text>

                  {tx.dueDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Calendar color={overdue ? colors.destructive : colors.mutedFg} size={12} />
                      <Text
                        style={{
                          color: overdue ? colors.destructive : colors.mutedFg,
                          fontSize: 13,
                          fontWeight: overdue ? '700' : '500',
                        }}
                      >
                        {t('due')}: {tx.dueDate}{' '}
                        {overdue ? `(${t('overdue')})` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                  <Text style={{ color: colors.mutedFg, fontSize: 13 }}>
                    {t('pending')}
                  </Text>
                  <Text
                    style={{
                      color: isSettled ? colors.primary : colors.destructive,
                      fontWeight: '800',
                      fontSize: 16,
                    }}
                  >
                    {fmt(pending)}
                  </Text>
                  <Text style={{ color: colors.mutedFg, fontSize: 13 }}>
                    {t('total')}: {fmt(tx.amount)}
                  </Text>
                </View>
              </View>

              {/* Action buttons & history toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                  paddingTop: 8,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                }}
              >
                <TouchableOpacity
                  onPress={() => setExpandedTxId(isExpanded ? null : tx.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {payments.length} {t('installments')}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp color={colors.primary} size={14} />
                  ) : (
                    <ChevronDown color={colors.primary} size={14} />
                  )}
                </TouchableOpacity>

                {!isSettled ? (
                  <Button
                    title={t('payInstallment')}
                    onPress={() => {
                      setSelectedTx(tx);
                      setPayAmount(String(pending));
                    }}
                    size="sm"
                    variant={overdue ? 'destructive' : 'secondary'}
                  />
                ) : (
                  <Badge text={t('fullyPaid')} variant="success" />
                )}
              </View>

              {/* Expanded Payment History */}
              {isExpanded && (
                <View
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    {t('paymentHistory')}:
                  </Text>
                  {payments.length === 0 ? (
                    <Text style={{ color: colors.mutedFg, fontSize: 13, fontStyle: 'italic' }}>
                      {t('noPartialPayments')}
                    </Text>
                  ) : (
                    payments.map((p, idx) => (
                      <View
                        key={p.id || idx}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingVertical: 4,
                          borderBottomWidth: idx < payments.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <View>
                          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                            {fmtDMY(p.date)} • {p.paymentMode?.toUpperCase()}
                          </Text>
                          {p.notes && (
                            <Text style={{ color: colors.mutedFg, fontSize: 13, fontStyle: 'italic' }}>
                              {p.notes}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                          +{fmt(p.amount)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </Card>
          );
        }}
      />

      {/* Settle / Pay Installment Modal */}
      {selectedTx && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedTx(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CreditCard color={colors.warning} size={18} />
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    {t('payCreditDue')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTx(null)}>
                  <X color={colors.foreground} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.mutedFg, fontSize: 12, marginBottom: 12 }}>
                {selectedTx.partyName || selectedTx.category} • {t('pending')}:{' '}
                <Text style={{ fontWeight: '700', color: colors.destructive }}>
                  {fmt(selectedTx.pendingAmount ?? selectedTx.amount)}
                </Text>
              </Text>

              <Input
                label={t('repaymentAmount')}
                value={payAmount}
                onChangeText={(v) => setPayAmount(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder={String(selectedTx.pendingAmount ?? selectedTx.amount)}
              />

              <DatePickerInput
                label={t('paymentDate')}
                value={payDate}
                onChange={setPayDate}
              />

              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                {t('paymentMode')}
              </Text>
              <View style={styles.modeRow}>
                {(['upi', 'cash', 'bank'] as PaymentMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPayMode(mode)}
                    style={[
                      styles.modeChip,
                      {
                        backgroundColor: payMode === mode ? colors.primary + '15' : colors.card,
                        borderColor: payMode === mode ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: payMode === mode ? colors.primary : colors.foreground,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label={t('notes')}
                value={payNotes}
                onChangeText={setPayNotes}
                placeholder={t('repaymentNotesPlaceholder')}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Button
                  title={t('cancel')}
                  variant="outline"
                  onPress={() => setSelectedTx(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('recordPayment')}
                  loading={loading}
                  onPress={handleSettleSubmit}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainTitle: { fontSize: 16, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  kpiCard: { flex: 1, borderRadius: 24, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  kpiLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiVal: { fontSize: 16, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 16, borderWidth: 1, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
});
