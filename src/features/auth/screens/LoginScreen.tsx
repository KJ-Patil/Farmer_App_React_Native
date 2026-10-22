import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function LoginScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const {
    requestOtp,
    verifyOtp,
    loginWithVerifiedMobile,
    otpSent,
    isLoading,
    error,
    clearError,
    fetchUserProfile,
  } = useAuthStore();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loginError, setLoginError] = useState('');

  const isMr = i18n.language === 'mr';

  const toggleLanguage = () => {
    const newLang = isMr ? 'en' : 'mr';
    i18n.changeLanguage(newLang);
  };

  const handleRequestOtp = async () => {
    if (mobile.length !== 10) return;
    clearError();
    setLoginError('');
    await requestOtp(mobile);
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    clearError();
    setLoginError('');

    const success = await verifyOtp(otp);
    if (!success) return;

    try {
      const loggedIn = await loginWithVerifiedMobile(mobile);
      if (loggedIn) {
        console.log('LOGIN SUCCESS');
      } else {
        console.log('NAVIGATING TO REGISTER');
        navigation.navigate('Register', { mobile });
      }
    } catch (e: any) {
      console.log('LOGIN FAILED:', e?.code, e?.message);
      setLoginError(e?.message || t('loginFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
        <Text style={[styles.langText, { color: colors.primary }]}>
          {isMr ? 'EN' : 'मरा'}
        </Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('appName')}
          </Text>
        </View>

        <Card style={styles.card}>
          {step === 'mobile' ? (
            <>
              <Input
                label={t('mobileNumber')}
                placeholder={t('enterMobile')}
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Button
                title={t('requestOtp')}
                onPress={handleRequestOtp}
                loading={isLoading}
                disabled={mobile.length !== 10}
                fullWidth
                style={{ marginTop: 4 }}
              />
            </>
          ) : (
            <>
              <Text style={[styles.otpInfo, { color: colors.mutedFg }]}>
                {t('otpSent')} +91 {mobile}
              </Text>
              <Input
                label={t('enterOtp')}
                placeholder="000000"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                title={t('verifyOtp')}
                onPress={handleVerifyOtp}
                loading={isLoading}
                disabled={otp.length !== 6}
                fullWidth
                style={{ marginTop: 4 }}
              />
              <TouchableOpacity onPress={() => { setStep('mobile'); setOtp(''); setLoginError(''); clearError(); }} style={styles.backLink}>
                <Text style={{ color: colors.primary }}>{t('back')}</Text>
              </TouchableOpacity>
            </>
          )}

          {(error || loginError) && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error || loginError}</Text>
          )}
        </Card>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.mutedFg }]}>{t('or')}</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title={t('signInWithGoogle')}
          onPress={() => {}}
          variant="outline"
          fullWidth
          style={{ marginBottom: 12 }}
        />

        {Platform.OS === 'ios' && (
          <Button
            title={t('signInWithApple')}
            onPress={() => {}}
            variant="outline"
            fullWidth
            style={{ marginBottom: 12 }}
          />
        )}

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedFg }}>{t('dontHaveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  langBtn: { position: 'absolute', top: 48, right: 16, padding: 8, zIndex: 10 },
  langText: { fontSize: 16, fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  card: { marginBottom: 20 },
  otpInfo: { fontSize: 13, marginBottom: 12 },
  backLink: { marginTop: 12, alignItems: 'center' },
  errorText: { marginTop: 12, fontSize: 13, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 12, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});
