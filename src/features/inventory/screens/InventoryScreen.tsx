import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useInventoryStore } from '../../../shared/hooks/useInventoryStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PurchaseStockModal } from '../components/PurchaseStockModal';
import { IssueToCropModal } from '../components/IssueToCropModal';
import { AddCustomItemModal } from '../components/AddCustomItemModal';

type TabKey = 'stock' | 'purchase' | 'issues' | 'master';

export function InventoryScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { items, purchases, consumptions, fetchItems, fetchPurchases, fetchConsumptions, isLoading } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<TabKey>('stock');
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [issueVisible, setIssueVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const isMr = i18n.language === 'mr';

  useEffect(() => {
    fetchItems();
    fetchPurchases();
    fetchConsumptions();
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'stock', label: t('liveStock') },
    { key: 'purchase', label: t('purchaseRegister') },
    { key: 'issues', label: t('materialIssues') },
    { key: 'master', label: t('inputMaster') },
  ];

  const totalValue = items.reduce((s, i) => s + i.currentStock * i.purchaseRate, 0);

  return (
    <ScreenLayout noPadding>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, { borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent', borderBottomWidth: 2 }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === tab.key ? colors.primary : colors.mutedFg }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'stock' && (
          <FlatList
            data={items.filter((i) => i.currentStock > 0)}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <Card style={{ marginTop: 12, marginBottom: 8 }} padding={14}>
                <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{t('totalValue')}</Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>₹{totalValue.toLocaleString('en-IN')}</Text>
              </Card>
            }
            ListEmptyComponent={<Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>}
            renderItem={({ item }) => (
              <Card style={{ marginTop: 6 }} padding={12}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '600' }}>{isMr && item.nameMr ? item.nameMr : item.name}</Text>
                    <Badge text={t(item.type)} variant="info" />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{item.currentStock} {item.unit}</Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 12 }}>₹{item.purchaseRate}/{item.unit}</Text>
                  </View>
                </View>
              </Card>
            )}
          />
        )}

        {activeTab === 'purchase' && (
          <FlatList
            data={purchases}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <Button title={t('purchaseStock')} onPress={() => setPurchaseVisible(true)} style={{ marginTop: 12 }} fullWidth />
            }
            ListEmptyComponent={<Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>}
            renderItem={({ item: p }) => (
              <Card style={{ marginTop: 6 }} padding={12}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.itemName}</Text>
                <Text style={{ color: colors.mutedFg, fontSize: 12 }}>
                  {p.date} • {p.quantity} × ₹{p.rate} = ₹{p.totalAmount}
                </Text>
              </Card>
            )}
          />
        )}

        {activeTab === 'issues' && (
          <FlatList
            data={consumptions}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <Button title={t('issueToCrop')} onPress={() => setIssueVisible(true)} style={{ marginTop: 12 }} fullWidth />
            }
            ListEmptyComponent={<Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 40 }}>{t('noData')}</Text>}
            renderItem={({ item: c }) => (
              <Card style={{ marginTop: 6 }} padding={12}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{c.itemName}</Text>
                <Text style={{ color: colors.mutedFg, fontSize: 12 }}>
                  {c.date} • {c.quantity} → {c.cropName} ({c.plotName})
                </Text>
              </Card>
            )}
          />
        )}

        {activeTab === 'master' && (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <Button title={t('addItem')} onPress={() => setAddItemVisible(true)} style={{ marginTop: 12 }} fullWidth />
            }
            renderItem={({ item }) => (
              <Card style={{ marginTop: 6 }} padding={12}>
                <View style={styles.row}>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
                    {item.nameMr && <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{item.nameMr}</Text>}
                  </View>
                  <Badge text={t(item.type)} variant="info" />
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <PurchaseStockModal visible={purchaseVisible} onClose={() => { setPurchaseVisible(false); fetchItems(); fetchPurchases(); }} />
      <IssueToCropModal visible={issueVisible} onClose={() => { setIssueVisible(false); fetchItems(); fetchConsumptions(); }} />
      <AddCustomItemModal visible={addItemVisible} onClose={() => { setAddItemVisible(false); fetchItems(); }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tabContent: { paddingHorizontal: 12, gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 12 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
