import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { useThemeStore } from '../../../shared/hooks/useThemeStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user, signOut, isLoading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const isMr = i18n.language === 'mr';

  const handleSignOut = () => {
    Alert.alert(t('signOut'), 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const toggleLanguage = () => {
    const newLang = isMr ? 'en' : 'mr';
    i18n.changeLanguage(newLang);
  };

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings')}</Text>

        <Card style={{ marginTop: 12 }}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'F'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{user?.fullName || 'Farmer'}</Text>
              <Text style={{ color: colors.mutedFg, fontSize: 13 }}>+91 {user?.mobileNumber}</Text>
              <Text style={{ color: colors.mutedFg, fontSize: 12 }}>{user?.emailId}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('personalDetails')}</Text>
          {[
            { label: t('fullName'), value: user?.fullName },
            { label: t('alternateMobile'), value: user?.alternateMobile || '—' },
            { label: t('dateOfBirth'), value: user?.dateOfBirth || '—' },
            { label: t('aadhaarNumber'), value: user?.aadhaarNumber || '—' },
            { label: t('farmerId'), value: user?.farmerId || '—' },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={{ color: colors.mutedFg, flex: 1 }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '500', flex: 1, textAlign: 'right' }}>{item.value}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('address')}</Text>
          {[
            { label: t('village'), value: user?.village },
            { label: t('taluka'), value: user?.taluka },
            { label: t('district'), value: user?.district },
            { label: t('state'), value: user?.state },
            { label: t('pincode'), value: user?.pincode },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={{ color: colors.mutedFg, flex: 1 }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '500', flex: 1, textAlign: 'right' }}>{item.value || '—'}</Text>
            </View>
          ))}
          {user?.geoLocation && (
            <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 4 }}>
              📍 {user.geoLocation.lat.toFixed(4)}, {user.geoLocation.lng.toFixed(4)}
            </Text>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('language')}</Text>
          <View style={styles.optionRow}>
            {(['en', 'mr'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => i18n.changeLanguage(lang)}
                style={[
                  styles.optionBtn,
                  {
                    borderColor: i18n.language === lang ? colors.primary : colors.border,
                    backgroundColor: i18n.language === lang ? colors.primary + '15' : colors.card,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={{ color: i18n.language === lang ? colors.primary : colors.foreground, fontWeight: '600' }}>
                  {lang === 'en' ? 'English' : 'मराठी'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('theme')}</Text>
          <View style={styles.optionRow}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setTheme(mode)}
                style={[
                  styles.optionBtn,
                  {
                    borderColor: theme === mode ? colors.primary : colors.border,
                    backgroundColor: theme === mode ? colors.primary + '15' : colors.card,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={{ color: theme === mode ? colors.primary : colors.foreground, fontWeight: '600', fontSize: 13 }}>
                  {t(`${mode}Mode`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('googleAccount')}</Text>
          <Button title={t('linkAccount')} onPress={() => {}} variant="outline" fullWidth />
        </Card>

        {Platform.OS === 'ios' && (
          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('appleAccount')}</Text>
            <Button title={t('linkAccount')} onPress={() => {}} variant="outline" fullWidth />
          </Card>
        )}

        <Button
          title={t('signOut')}
          onPress={handleSignOut}
          variant="destructive"
          loading={isLoading}
          fullWidth
          style={{ marginTop: 24 }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: { flex: 1, borderWidth: 1.5, padding: 12, alignItems: 'center' },
});
