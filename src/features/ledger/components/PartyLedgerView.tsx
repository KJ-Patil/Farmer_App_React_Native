import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface PartyEntry {
  name: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  txnCount: number;
  hasPending: boolean;
}

export function PartyLedgerView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useLedgerStore();
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  const parties = useMemo(() => {
    const map = new Map<string, PartyEntry>();
    transactions.forEach((tx) => {
      if (!tx.partyName) return;
      const existing = map.get(tx.partyName) || { name: tx.partyName, totalDebit: 0, totalCredit: 0, netBalance: 0, txnCount: 0, hasPending: false };
      if (tx.type === 'expense') existing.totalDebit += tx.amount;
      else existing.totalCredit += tx.amount;
      existing.txnCount++;
      if (tx.pendingAmount && tx.pendingAmount > 0) existing.hasPending = true;
      existing.netBalance = existing.totalCredit - existing.totalDebit;
      map.set(tx.partyName, existing);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.hasPending && !b.hasPending) return -1;
      if (!a.hasPending && b.hasPending) return 1;
      return b.txnCount - a.txnCount;
    });
  }, [transactions]);

  const partyTxns = selectedParty
    ? transactions.filter((tx) => tx.partyName === selectedParty).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    : [];

  if (selectedParty) {
    let runningBalance = 0;
    return (
      <FlatList
        data={partyTxns}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => setSelectedParty(null)} style={{ paddingVertical: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>&larr; All Parties</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 10 }}>{selectedParty}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { color: colors.mutedFg, flex: 1.5 }]}>{t('date')}</Text>
              <Text style={[styles.colHeader, { color: colors.mutedFg, flex: 1 }]}>Dr</Text>
              <Text style={[styles.colHeader, { color: colors.mutedFg, flex: 1 }]}>Cr</Text>
              <Text style={[styles.colHeader, { color: colors.mutedFg, flex: 1 }]}>Balance</Text>
            </View>
          </View>
        }
        renderItem={({ item: tx }) => {
          const debit = tx.type === 'expense' ? tx.amount : 0;
          const credit = tx.type === 'income' ? tx.amount : 0;
          runningBalance += credit - debit;
          return (
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.cell, { color: colors.foreground, flex: 1.5 }]}>{tx.date}</Text>
              <Text style={[styles.cell, { color: debit ? colors.destructive : colors.mutedFg, flex: 1 }]}>{debit ? `₹${debit}` : '—'}</Text>
              <Text style={[styles.cell, { color: credit ? colors.primary : colors.mutedFg, flex: 1 }]}>{credit ? `₹${credit}` : '—'}</Text>
              <Text style={[styles.cell, { color: runningBalance >= 0 ? colors.primary : colors.destructive, flex: 1, fontWeight: '600' }]}>₹{Math.abs(runningBalance)}</Text>
            </View>
          );
        }}
      />
    );
  }

  return (
    <FlatList
      data={parties}
      keyExtractor={(p) => p.name}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      ListEmptyComponent={<Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>}
      renderItem={({ item: party }) => (
        <TouchableOpacity onPress={() => setSelectedParty(party.name)}>
          <Card style={{ marginTop: 8 }} padding={12}>
            <View style={styles.partyRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{party.name}</Text>
                <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{party.txnCount} transactions</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: party.netBalance >= 0 ? colors.primary : colors.destructive, fontWeight: '700' }}>
                  ₹{Math.abs(party.netBalance).toLocaleString('en-IN')}
                </Text>
                <Badge text={party.netBalance >= 0 ? 'Cr' : 'Dr'} variant={party.netBalance >= 0 ? 'success' : 'destructive'} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  partyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  colHeader: { fontSize: 12, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5 },
  cell: { fontSize: 12 },
});
