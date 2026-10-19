import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Share } from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CSV_BOM } from '../../../shared/utils/helpers';

interface ReportDef {
  key: string;
  labelKey: string;
}

const REPORTS: ReportDef[] = [
  { key: 'general_ledger', labelKey: 'generalLedger' },
  { key: 'daily_cash', labelKey: 'dailyCashBook' },
  { key: 'bank_upi', labelKey: 'bankUpiBook' },
  { key: 'pnl', labelKey: 'profitLossStatement' },
  { key: 'plot_wise', labelKey: 'plotWiseReport' },
  { key: 'crop_wise', labelKey: 'cropWiseReport' },
  { key: 'dairy', labelKey: 'dairyReport' },
  { key: 'income_only', labelKey: 'incomeReport' },
  { key: 'expense_only', labelKey: 'expenseReport' },
  { key: 'party_loan', labelKey: 'partyLoanLedger' },
  { key: 'input_consumption', labelKey: 'inputConsumption' },
  { key: 'input_stock', labelKey: 'inputStockReport' },
  { key: 'season_wise', labelKey: 'seasonWiseAgri' },
];

export function ReportsHubView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useLedgerStore();

  const generateCSV = (reportKey: string): string => {
    let filtered = transactions;

    switch (reportKey) {
      case 'daily_cash': filtered = transactions.filter((tx) => tx.paymentMode === 'cash'); break;
      case 'bank_upi': filtered = transactions.filter((tx) => ['bank', 'upi', 'cheque'].includes(tx.paymentMode)); break;
      case 'income_only': filtered = transactions.filter((tx) => tx.type === 'income'); break;
      case 'expense_only': filtered = transactions.filter((tx) => tx.type === 'expense'); break;
      case 'dairy': filtered = transactions.filter((tx) => tx.ledgerType === 'dairy'); break;
    }

    const header = 'Date,Type,Category,Amount,Payment Mode,Party,Plot,Crop,Bill#,Notes';
    const rows = filtered.map((tx) =>
      [tx.date, tx.type, tx.category, tx.amount, tx.paymentMode, tx.partyName || '', tx.plotName || '', tx.cropName || '', tx.billNumber || '', tx.notes || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return CSV_BOM + header + '\n' + rows.join('\n');
  };

  const handleCSVExport = async (reportKey: string, label: string) => {
    try {
      const csv = generateCSV(reportKey);
      const fileName = `${label.replace(/\s+/g, '_')}_${Date.now()}.csv`;
      const file = new File(Paths.cache, fileName);
      await file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: label });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWhatsApp = (reportKey: string) => {
    const csv = generateCSV(reportKey);
    const lines = csv.split('\n').slice(0, 20);
    const text = lines.join('\n') + (csv.split('\n').length > 20 ? '\n...(truncated)' : '');
    Share.share({ message: text });
  };

  return (
    <FlatList
      data={REPORTS}
      keyExtractor={(r) => r.key}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      renderItem={({ item, index }) => (
        <Card style={{ marginTop: index === 0 ? 12 : 8 }} padding={14}>
          <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15, marginBottom: 8 }}>
            {index + 1}. {t(item.labelKey)}
          </Text>
          <View style={styles.btnRow}>
            <Button title={t('downloadCsv')} onPress={() => handleCSVExport(item.key, t(item.labelKey))} variant="outline" size="sm" style={{ flex: 1 }} />
            <Button title={t('shareWhatsapp')} onPress={() => handleWhatsApp(item.key)} variant="outline" size="sm" style={{ flex: 1 }} />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  btnRow: { flexDirection: 'row', gap: 8 },
});
