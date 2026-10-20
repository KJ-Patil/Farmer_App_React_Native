import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
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
import { Package, ShoppingCart, TrendingDown, Plus, Search } from 'lucide-react-native';

type TabKey = 'stock' | 'purchase' | 'issues' | 'master';
const ITEM_TYPES = ['all', 'fertilizer', 'seed', 'pesticide', 'other'] as const;

export function InventoryScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { items, purchases, consumptions, fetchItems, fetchPurchases, fetchConsumptions, isLoading } =
    useInventoryStore();

  const [activeTab, setActiveTab] = useState<TabKey>('stock');
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [issueVisible, setIssueVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');

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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchType = selectedType === 'all' || item.type === selectedType;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.nameMr && item.nameMr.includes(q));
      return matchType && matchSearch;
    });
  }, [items, selectedType, search]);

  const inStockItems = useMemo(() => {
    return filteredItems.filter((i) => (i.currentStock || 0) > 0);
  }, [filteredItems]);

  const [selectedItemForAction, setSelectedItemForAction] = useState<string | undefined>(undefined);

  const handleOpenPurchase = (itemId?: string) => {
    setSelectedItemForAction(itemId);
    setPurchaseVisible(true);
  };

  const handleOpenIssue = (itemId?: string) => {
    setSelectedItemForAction(itemId);
    setIssueVisible(true);
  };

  const summaryMetrics = useMemo(() => {
    let totalStockValue = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      totalStockValue += item.totalValue || (item.currentStock * item.purchaseRate);
      if ((item.currentStock || 0) > 0) inStockCount++;
      else outOfStockCount++;
    });

    let monthPurchasesTotal = 0;
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    purchases.forEach((p) => {
      if (p.date?.startsWith(currentMonthStr)) {
        monthPurchasesTotal += Number(p.totalAmount) || 0;
      }
    });

    let monthIssuedTotal = 0;
    consumptions.forEach((c) => {
      if (c.date?.startsWith(currentMonthStr)) {
        monthIssuedTotal += Number(c.totalExpense || c.totalAmount) || 0;
      }
    });

    return {
      totalStockValue,
      totalItemsCount: items.length,
      inStockCount,
      outOfStockCount,
      monthPurchasesTotal,
      monthIssuedTotal,
    };
  }, [items, purchases, consumptions]);

  return (
    <ScreenLayout noPadding>
      {/* Subtabs Bar matching FarmerLedger */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              {
                borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === tab.key ? '700' : '600',
                color: activeTab === tab.key ? colors.primary : colors.mutedFg,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {/* TAB 1: LIVE STOCK */}
        {activeTab === 'stock' && (
          <FlatList
            data={inStockItems.length > 0 ? inStockItems : filteredItems}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ marginTop: 12, marginBottom: 8 }}>
                {/* 4 KPI Cards Strip matching FarmerLedger */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                >
                  <Card style={{ minWidth: 145, borderColor: colors.primary + '30', backgroundColor: colors.primary + '0A' }} padding={12}>
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t('totalStockValue')}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800', marginTop: 3 }}>
                      ₹{summaryMetrics.totalStockValue.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 10, marginTop: 1 }}>
                      {summaryMetrics.inStockCount} {t('itemsInStock')}
                    </Text>
                  </Card>

                  <Card style={{ minWidth: 145, borderColor: '#3B82F630', backgroundColor: '#3B82F60A' }} padding={12}>
                    <Text style={{ color: '#2563EB', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t('monthlyPurchases')}
                    </Text>
                    <Text style={{ color: '#2563EB', fontSize: 18, fontWeight: '800', marginTop: 3 }}>
                      ₹{summaryMetrics.monthPurchasesTotal.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 10, marginTop: 1 }}>
                      {purchases.length} {t('purchasesCount')}
                    </Text>
                  </Card>

                  <Card style={{ minWidth: 145, borderColor: '#10B98130', backgroundColor: '#10B9810A' }} padding={12}>
                    <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t('issuedToCrops')}
                    </Text>
                    <Text style={{ color: '#059669', fontSize: 18, fontWeight: '800', marginTop: 3 }}>
                      ₹{summaryMetrics.monthIssuedTotal.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 10, marginTop: 1 }}>
                      {consumptions.length} {t('issuesCount')}
                    </Text>
                  </Card>

                  <Card style={{ minWidth: 145 }} padding={12}>
                    <Text style={{ color: colors.mutedFg, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t('stockHealth')}
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 3 }}>
                      {summaryMetrics.totalItemsCount}
                    </Text>
                    <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '700', marginTop: 1 }}>
                      {summaryMetrics.outOfStockCount} {t('outOfStock')}
                    </Text>
                  </Card>
                </ScrollView>

                {/* Quick Action Buttons */}
                <View style={styles.actionRow}>
                  <Button
                    title={`+ ${t('purchaseStock')}`}
                    onPress={() => handleOpenPurchase()}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('issueToCrop')}
                    onPress={() => handleOpenIssue()}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={`+ ${t('new')}`}
                    onPress={() => setAddItemVisible(true)}
                    variant="ghost"
                    size="sm"
                  />
                </View>

                {/* Search & Category Filter */}
                <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Search color={colors.mutedFg} size={16} />
                  <TextInput
                    placeholder={t('searchInventoryPlaceholder')}
                    placeholderTextColor={colors.mutedFg}
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.searchInput, { color: colors.foreground }]}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {ITEM_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedType(type)}
                      style={[
                        styles.filterChip,
                        {
                          borderColor: selectedType === type ? colors.primary : colors.border,
                          backgroundColor: selectedType === type ? colors.primary + '15' : colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: selectedType === type ? colors.primary : colors.mutedFg,
                        }}
                      >
                        {type === 'all' ? (t('all') || 'All') : t(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            }
            ListEmptyComponent={
              <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 32 }}>
                {t('noData')}
              </Text>
            }
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 8 }} padding={14}>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {isMr && item.nameMr ? item.nameMr : item.name}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>
                      {item.nameMr && !isMr ? item.nameMr : item.notes || ''}
                    </Text>
                    <View style={{ marginTop: 4 }}>
                      <Badge text={t(item.type) || item.type} variant="info" />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        color: (item.currentStock || 0) > 0 ? colors.primary : colors.destructive,
                        fontWeight: '800',
                        fontSize: 16,
                      }}
                    >
                      {item.currentStock || 0} {item.unit}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>
                      ₹{item.purchaseRate || 0}/{item.unit}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                      ₹{((item.currentStock || 0) * (item.purchaseRate || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Quick actions for this item */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, justifyContent: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8 }}>
                  <Button
                    title={`+ ${t('buy')}`}
                    onPress={() => handleOpenPurchase(item.id)}
                    variant="outline"
                    size="sm"
                  />
                  <Button
                    title={t('issue')}
                    onPress={() => handleOpenIssue(item.id)}
                    disabled={(item.currentStock || 0) <= 0}
                    size="sm"
                  />
                </View>
              </Card>
            )}
          />
        )}

        {/* TAB 2: PURCHASE REGISTER */}
        {activeTab === 'purchase' && (
          <FlatList
            data={purchases}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ marginVertical: 12 }}>
                <Button
                  title={`+ ${t('purchaseStock')}`}
                  onPress={() => setPurchaseVisible(true)}
                  fullWidth
                />
              </View>
            }
            ListEmptyComponent={
              <Card style={{ padding: 24, alignItems: 'center' }}>
                <ShoppingCart color={colors.mutedFg} size={32} />
                <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 8 }}>
                  {t('noPurchasesRecorded')}
                </Text>
              </Card>
            }
            renderItem={({ item: p }) => (
              <Card style={{ marginBottom: 8 }} padding={14}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {p.itemName}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 12, marginTop: 2 }}>
                      {p.date} • {p.supplierName || t('generalSupplier')}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 1 }}>
                      {p.quantity} × ₹{p.rate}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 15 }}>
                      ₹{p.totalAmount?.toLocaleString('en-IN')}
                    </Text>
                    <Badge text={(p.paymentMode || 'cash').toUpperCase()} />
                  </View>
                </View>
              </Card>
            )}
          />
        )}

        {/* TAB 3: MATERIAL ISSUES */}
        {activeTab === 'issues' && (
          <FlatList
            data={consumptions}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ marginVertical: 12 }}>
                <Button
                  title={`+ ${t('issueToCrop')}`}
                  onPress={() => setIssueVisible(true)}
                  fullWidth
                />
              </View>
            }
            ListEmptyComponent={
              <Card style={{ padding: 24, alignItems: 'center' }}>
                <TrendingDown color={colors.mutedFg} size={32} />
                <Text style={{ color: colors.mutedFg, textAlign: 'center', marginTop: 8 }}>
                  {t('noMaterialsIssued')}
                </Text>
              </Card>
            }
            renderItem={({ item: c }) => (
              <Card style={{ marginBottom: 8 }} padding={14}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {c.itemName}
                    </Text>
                    <Text style={{ color: colors.mutedFg, fontSize: 12, marginTop: 2 }}>
                      {c.date} • {c.cropName || t('crops')} ({c.plotName || t('plots')})
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>
                      {c.quantity} {c.unit}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          />
        )}

        {/* TAB 4: INPUT MASTER */}
        {activeTab === 'master' && (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ marginVertical: 12 }}>
                <Button
                  title={`+ ${t('addItem')}`}
                  onPress={() => setAddItemVisible(true)}
                  fullWidth
                />
              </View>
            }
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 8 }} padding={14}>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {isMr && item.nameMr ? item.nameMr : item.name}
                    </Text>
                    {item.nameMr && !isMr ? (
                      <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 1 }}>{item.nameMr}</Text>
                    ) : null}
                    {item.notes ? (
                      <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 2 }}>{item.notes}</Text>
                    ) : null}
                  </View>
                  <Badge text={t(item.type) || item.type} variant="info" />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 }}>
                  <Text style={{ color: colors.mutedFg, fontSize: 12 }}>
                    {t('rate')}: ₹{item.purchaseRate || 0}/{item.unit}
                  </Text>
                  <Text style={{ color: (item.currentStock || 0) > 0 ? colors.primary : colors.destructive, fontWeight: '700', fontSize: 12 }}>
                    {t('stock')}: {item.currentStock || 0} {item.unit}
                  </Text>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <PurchaseStockModal
        visible={purchaseVisible}
        initialItemId={selectedItemForAction}
        onClose={() => {
          setPurchaseVisible(false);
          setSelectedItemForAction(undefined);
          fetchItems();
          fetchPurchases();
        }}
      />
      <IssueToCropModal
        visible={issueVisible}
        initialItemId={selectedItemForAction}
        onClose={() => {
          setIssueVisible(false);
          setSelectedItemForAction(undefined);
          fetchItems();
          fetchConsumptions();
        }}
      />
      <AddCustomItemModal
        visible={addItemVisible}
        onClose={() => {
          setAddItemVisible(false);
          fetchItems();
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabBar: { maxHeight: 48, borderBottomWidth: 1 },
  tabContent: { paddingHorizontal: 12, gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 12 },
  content: { flex: 1 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 42, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13 },
  filterScroll: { marginVertical: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
