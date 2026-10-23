import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../app/providers/ThemeProvider';
import { OfflineBanner } from '../ui/OfflineBanner';

interface ScreenLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function ScreenLayout({ children, noPadding }: ScreenLayoutProps) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <OfflineBanner />
      <View style={[styles.content, !noPadding && styles.padding]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  padding: { paddingHorizontal: 16 },
});
