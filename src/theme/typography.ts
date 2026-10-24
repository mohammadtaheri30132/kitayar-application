import { Platform, TextStyle } from 'react-native';

export const FONT_FAMILY = {
  regular: Platform.select({
    android: 'Estedad-FD-Regular',
    ios: 'Estedad-FD Regular',
    default: 'Estedad-FD-Regular',
  }),
  medium: Platform.select({
    android: 'Estedad-FD-Medium',
    ios: 'Estedad-FD Medium',
    default: 'Estedad-FD-Medium',
  }),
  bold: Platform.select({
    android: 'Estedad-FD-Bold',
    ios: 'Estedad-FD Bold',
    default: 'Estedad-FD-Bold',
  }),
  extraBold: Platform.select({
    android: 'Estedad-FD-ExtraBold',
    ios: 'Estedad-FD ExtraBold',
    default: 'Estedad-FD-ExtraBold',
  }),
  black: Platform.select({
    android: 'Estedad-FD-Black',
    ios: 'Estedad-FD Black',
    default: 'Estedad-FD-Black',
  }),
  light: Platform.select({
    android: 'Estedad-FD-Light',
    ios: 'Estedad-FD Light',
    default: 'Estedad-FD-Light',
  }),
};

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 28,
    lineHeight: 40,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  heading1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 34,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  heading2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  heading3: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  bodySmall: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  label: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: 'normal',
    textAlign: 'right',
  },
  button: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: 'normal',
    textAlign: 'center',
  },
  numeric: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 'normal',
    textAlign: 'right',
  },
};
