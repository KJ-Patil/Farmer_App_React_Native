import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useLedgerStore } from '../../../shared/hooks/useLedgerStore';
import { useInventoryStore } from '../../../shared/hooks/useInventoryStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { CSV_BOM } from '../../../shared/utils/helpers';
import type { Transaction } from '../../../shared/types/ledger';
import {
  FileText,
  Download,
  Share2,
  BookOpen,
  Landmark,
  ExternalLink,
  Sparkles,
  Sprout,
  Milk,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
} from 'lucide-react-native';

type ReportKey =
  | 'ledger'
  | 'cash_book'
  | 'bank_book'
  | 'profit_loss'
  | 'plot_report'
  | 'crop_report'
  | 'dairy_report'
  | 'income_report'
  | 'expense_report'
  | 'party_loan_report'
  | 'input_stock';

interface ReportDef {
  key: ReportKey;
  labelKey: string;
  descKey: string;
}

const REPORT_TABS: ReportDef[] = [
  { key: 'ledger', labelKey: 'report_ledger', descKey: 'report_ledger_desc' },
  { key: 'cash_book', labelKey: 'report_cash_book', descKey: 'report_cash_book_desc' },
  { key: 'bank_book', labelKey: 'report_bank_book', descKey: 'report_bank_book_desc' },
  { key: 'profit_loss', labelKey: 'report_profit_loss', descKey: 'report_profit_loss_desc' },
  { key: 'plot_report', labelKey: 'report_plot_report', descKey: 'report_plot_report_desc' },
  { key: 'crop_report', labelKey: 'report_crop_report', descKey: 'report_crop_report_desc' },
  { key: 'dairy_report', labelKey: 'report_dairy_report', descKey: 'report_dairy_report_desc' },
  { key: 'income_report', labelKey: 'report_income_report', descKey: 'report_income_report_desc' },
  { key: 'expense_report', labelKey: 'report_expense_report', descKey: 'report_expense_report_desc' },
  { key: 'party_loan_report', labelKey: 'report_party_loan_report', descKey: 'report_party_loan_report_desc' },
  { key: 'input_stock', labelKey: 'report_input_stock', descKey: 'report_input_stock_desc' },
];

export function ReportsHubView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useLedgerStore();
  const { items: inventoryItems, consumptions: inventoryConsumptions } = useInventoryStore();

  const [selectedReport, setSelectedReport] = useState<ReportKey>('ledger');

  // Date filters: default 1st of current month to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtered transactions for selected report
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = tx.date || '';
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;

      switch (selectedReport) {
        case 'cash_book':
          return tx.paymentMode === 'cash';
        case 'bank_book':
          return tx.paymentMode === 'bank' || tx.paymentMode === 'upi' || tx.paymentMode === 'cheque';
        case 'profit_loss':
          return true;
        case 'plot_report':
          return !!tx.plotId || !!tx.plotName;
        case 'crop_report':
          return !!tx.cropId || !!tx.cropName;
        case 'dairy_report':
          return (
            tx.ledgerType === 'dairy' ||
            tx.incomeCategory === 'dairy' ||
            (tx.category && (tx.category.startsWith('dairy_') || tx.category.includes('दूध')))
          );
        case 'income_report':
          return tx.type === 'income';
        case 'expense_report':
          return tx.type === 'expense';
        case 'party_loan_report':
          return tx.ledgerType === 'party' || !!tx.partyName || tx.incomeCategory === 'loan';
        case 'input_stock':
        case 'ledger':
        default:
          return true;
      }
    });
  }, [transactions, selectedReport, startDate, endDate]);

  // Summary KPIs
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filteredData.forEach((tx) => {
      const amt = tx.amount || 0;
      if (tx.type === 'income') totalIn += amt;
      else totalOut += amt;
    });

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      count: filteredData.length,
    };
  }, [filteredData]);

  // CSV Generator
  const generateCSV = (): string => {
    if (selectedReport === 'input_stock') {
      const header = 'Item Name,Category,Current Stock,Unit,Purchase Rate (₹),Total Valuation (₹),Status';
      const rows = inventoryItems.map((item) =>
        [
          item.name,
          item.category || item.type,
          item.currentStock,
          item.unit,
          item.purchaseRate,
          item.currentStock * item.purchaseRate,
          item.currentStock <= (item.minStockThreshold || 5) ? 'LOW STOCK' : 'AVAILABLE',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      return CSV_BOM + header + '\n' + rows.join('\n');
    }

    const header = 'Date,Type,Category,Amount (₹),Payment Mode,Party Name,Plot,Crop,Bill Number,Notes';
    const rows = filteredData.map((tx) =>
      [
        tx.date,
        tx.type === 'income' ? 'INCOME' : 'EXPENSE',
        tx.category,
        tx.amount,
        tx.paymentMode?.toUpperCase() || 'CASH',
        tx.partyName || '',
        tx.plotName || '',
        tx.cropName || '',
        tx.billNumber || '',
        tx.notes || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    return CSV_BOM + header + '\n' + rows.join('\n');
  };

  // Cross-Platform Export Handler
  const handleCSVExport = async () => {
    try {
      const csv = generateCSV();
      const currentTabDef = REPORT_TABS.find((t) => t.key === selectedReport);
      const title = currentTabDef ? t(currentTabDef.labelKey) : 'Report';
      const fileName = `${title.replace(/[^a-zA-Z0-9_]/g, '_')}_${startDate}_to_${endDate}.csv`;

      if (Platform.OS === 'web') {
        // Web standard blob trigger
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Native mobile file system
      const file = new File(Paths.cache, fileName);
      await file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: title,
        });
      }
    } catch (err: any) {
      Alert.alert(t('exportError'), err.message);
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const currentTabDef = REPORT_TABS.find((tab) => tab.key === selectedReport);
    const title = t(currentTabDef?.labelKey || 'reportsExport');

    let text = `📊 *${title}*\n`;
    text += `📅 ${startDate} - ${endDate}\n`;
    text += `🟢 ${t('totalInflow')}: ₹${Math.round(summary.totalIn).toLocaleString('en-IN')}\n`;
    text += `🔴 ${t('totalOutflow')}: ₹${Math.round(summary.totalOut).toLocaleString('en-IN')}\n`;
    text += `⚖️ ${t('netBalance')}: ₹${Math.round(summary.net).toLocaleString('en-IN')}\n\n`;

    filteredData.slice(0, 10).forEach((tx) => {
      text += `• ${tx.date}: ${tx.category} ${tx.type === 'income' ? '+₹' : '-₹'}${tx.amount} (${tx.paymentMode})\n`;
    });

    if (filteredData.length > 10) {
      text += `...+${filteredData.length - 10}\n`;
    }

    Share.share({ message: text });
  };

  const fmt = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 8 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText color={colors.primary} size={18} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>
                {t('reportsHubTitle')}
              </Text>
            </View>
            <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>
              {t('reportsHubSubtitle')}
            </Text>

            {/* Horizontal Report Tabs Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {REPORT_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setSelectedReport(tab.key)}
                  style={[
                    styles.reportTab,
                    {
                      backgroundColor: selectedReport === tab.key ? colors.primary + '15' : colors.card,
                      borderColor: selectedReport === tab.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedReport === tab.key ? colors.primary : colors.foreground,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {t(tab.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date Range Selectors */}
            <Card style={{ marginBottom: 12 }} padding={12}>
              <Text style={{ color: colors.mutedFg, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
                {t('selectDateRange')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <DatePickerInput
                    label={t('fromLabel')}
                    value={startDate}
                    onChange={setStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePickerInput
                    label={t('toLabel')}
                    value={endDate}
                    onChange={setEndDate}
                  />
                </View>
              </View>
            </Card>

            {/* Summary KPIs */}
            <View style={styles.kpiRow}>
              <Card style={[styles.kpiCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]} padding={12}>
                <Text style={[styles.kpiLabel, { color: colors.primary }]}>{t('totalInflow')}</Text>
                <Text style={[styles.kpiVal, { color: colors.primary }]}>{fmt(summary.totalIn)}</Text>
              </Card>

              <Card style={[styles.kpiCard, { borderColor: colors.destructive + '30', backgroundColor: colors.destructive + '08' }]} padding={12}>
                <Text style={[styles.kpiLabel, { color: colors.destructive }]}>{t('totalOutflow')}</Text>
                <Text style={[styles.kpiVal, { color: colors.destructive }]}>{fmt(summary.totalOut)}</Text>
              </Card>

              <Card style={styles.kpiCard} padding={12}>
                <Text style={[styles.kpiLabel, { color: summary.net >= 0 ? colors.primary : colors.destructive }]}>
                  {t('netBalance')}
                </Text>
                <Text style={[styles.kpiVal, { color: summary.net >= 0 ? colors.primary : colors.destructive }]}>
                  {summary.net < 0 ? '-' : ''}{fmt(Math.abs(summary.net))}
                </Text>
              </Card>
            </View>

            {/* Action Export Buttons */}
            <View style={styles.actionRow}>
              <Button
                title={t('downloadCsv')}
                onPress={handleCSVExport}
                style={{ flex: 1 }}
              />
              <Button
                title={t('shareWhatsapp')}
                variant="outline"
                onPress={handleWhatsAppShare}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginTop: 14, marginBottom: 6 }}>
              {t('reportRecordsPreview')} ({filteredData.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <FileText color={colors.mutedFg} size={36} />
            <Text style={{ color: colors.mutedFg, marginTop: 10, fontSize: 13, fontWeight: '600' }}>
              {t('noRecordsFound')}
            </Text>
          </View>
        }
        renderItem={({ item: tx }) => (
          <Card style={{ marginTop: 6 }} padding={12}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>
                    {tx.category}
                  </Text>
                  <Badge
                    text={tx.paymentMode?.toUpperCase() || 'CASH'}
                    variant={tx.type === 'income' ? 'success' : 'default'}
                  />
                  {tx.billNumber && <Badge text={`#${tx.billNumber}`} variant="default" />}
                </View>
                <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>
                  {tx.date}
                  {tx.partyName ? ` • ${tx.partyName}` : ''}
                  {tx.cropName ? ` • ${tx.cropName}` : ''}
                </Text>
              </View>

              <Text
                style={{
                  color: tx.type === 'income' ? colors.primary : colors.destructive,
                  fontWeight: '800',
                  fontSize: 14,
                  marginLeft: 10,
                }}
              >
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reportTab: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 10, marginRight: 8 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: { flex: 1, borderRadius: 14 },
  kpiLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
});
