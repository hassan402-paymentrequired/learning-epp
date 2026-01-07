import { StyleSheet, Text, type TextProps, Platform } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Fonts, DEFAULT_FONT_FAMILY } from '@/constants/Fonts';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: DEFAULT_FONT_FAMILY,
      android: DEFAULT_FONT_FAMILY,
      default: undefined, // Use system font on web if custom font not loaded
    }),
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal', // Use font file weight instead
    }),
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: 'bold',
      default: 'normal',
    }),
  },
  subtitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: 'bold',
      default: 'normal',
    }),
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    fontFamily: Platform.select({
      ios: DEFAULT_FONT_FAMILY,
      android: DEFAULT_FONT_FAMILY,
      default: undefined,
    }),
  },
});
