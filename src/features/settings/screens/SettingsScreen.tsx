import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { useThemeStore } from '../../../shared/hooks/useThemeStore';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Sparkles, Edit3, X, Check, Globe, Moon, Sun } from 'lucide-react-native';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user, signOut, updateProfile, isLoading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const isMr = i18n.language === 'mr';

  // Profile Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [village, setVillage] = useState(user?.village || '');
  const [taluka, setTaluka] = useState(user?.taluka || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [state, setState] = useState(user?.state || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [alternateMobile, setAlternateMobile] = useState(user?.alternateMobile || '');
  const [saving, setSaving] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('signOut'), t('confirmSignOut'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        alternateMobile: alternateMobile.trim(),
      });
      setEditOpen(false);
      Alert.alert(t('success'), t('profileUpdatedSuccessfully'));
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'F';
  const dobValue = user?.dateOfBirth || (user as any)?.dob || '—';

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('settings')}</Text>
          <Button
            title={t('edit')}
            onPress={() => {
              setFullName(user?.fullName || '');
              setVillage(user?.village || '');
              setTaluka(user?.taluka || '');
              setDistrict(user?.district || '');
              setState(user?.state || '');
              setPincode(user?.pincode || '');
              setAlternateMobile(user?.alternateMobile || '');
              setEditOpen(true);
            }}
            variant="outline"
            size="sm"
          />
        </View>

        {/* Profile Header Card */}
        <Card style={{ marginTop: 12 }} padding={16}>
          <View style={styles.profileRow}>
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {user?.fullName || t('farmer')}
              </Text>
              <Text style={{ color: colors.mutedFg, fontSize: 13, marginTop: 1 }}>
                +91 {user?.mobileNumber}
              </Text>
              {user?.emailId ? (
                <Text style={{ color: colors.mutedFg, fontSize: 11, marginTop: 1 }}>
                  {user.emailId}
                </Text>
              ) : null}

              <View
                style={[
                  styles.membershipBadge,
                  { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
                ]}
              >
                <Sparkles color={colors.primary} size={12} />
                <Text style={[styles.membershipText, { color: colors.primary }]}>
                  {user?.membershipType === 'gold' ? t('goldAccount') : t('freeAccount')}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Personal Details Card */}
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('personalDetails')}
          </Text>
          {[
            { label: t('fullName'), value: user?.fullName },
            { label: t('alternateMobile'), value: user?.alternateMobile || '—' },
            { label: t('dateOfBirth'), value: dobValue },
            { label: t('aadhaarNumber') || 'Aadhaar Number', value: user?.aadhaarNumber || '—' },
            { label: t('farmerId') || 'Farmer ID', value: user?.farmerId || '—' },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={{ color: colors.mutedFg, flex: 1 }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '600', flex: 1, textAlign: 'right' }}>
                {item.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Address Card */}
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
              <Text style={{ color: colors.foreground, fontWeight: '600', flex: 1, textAlign: 'right' }}>
                {item.value || '—'}
              </Text>
            </View>
          ))}
          {user?.geoLocation && (
            <Text style={{ color: colors.primary, fontSize: 11, marginTop: 6 }}>
              📍 GPS: {(user.geoLocation as any).latitude || user.geoLocation.lat},{' '}
              {(user.geoLocation as any).longitude || user.geoLocation.lng}
            </Text>
          )}
        </Card>

        {/* Language Selection */}
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
                <Text
                  style={{
                    color: i18n.language === lang ? colors.primary : colors.foreground,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {lang === 'en' ? 'English' : 'मराठी'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Theme Selection */}
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
                <Text
                  style={{
                    color: theme === mode ? colors.primary : colors.foreground,
                    fontWeight: '600',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                >
                  {t(`${mode}Mode`) || mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title={t('signOut')}
          onPress={handleSignOut}
          variant="destructive"
          loading={isLoading}
          fullWidth
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} padding={20}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('editProfile')}</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <X color={colors.mutedFg} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Input label={t('fullName')} value={fullName} onChangeText={setFullName} />
              <Input label={t('village')} value={village} onChangeText={setVillage} />
              <Input label={t('taluka')} value={taluka} onChangeText={setTaluka} />
              <Input label={t('district')} value={district} onChangeText={setDistrict} />
              <Input label={t('state')} value={state} onChangeText={setState} />
              <Input label={t('pincode')} value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
              <Input label={t('alternateMobile')} value={alternateMobile} onChangeText={setAlternateMobile} keyboardType="phone-pad" />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="outline"
                onPress={() => setEditOpen(false)}
                disabled={saving}
                style={{ flex: 1 }}
              />
              <Button
                title={t('save')}
                onPress={handleSaveProfile}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#DDD' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700' },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, marginTop: 6 },
  membershipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
