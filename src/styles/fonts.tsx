import { StyleSheet } from 'react-native'
import Colors from 'src/styles/colors'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
  Bold: 'Inter-Bold',
}

/**
 * Figma TypeScale Styles
 */
export const typeScale = StyleSheet.create({
  displayLarge: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: -2.4,
  },
  displayMedium: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.12,
  },
  displaySmall: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  titleLarge: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32,
  },
  titleMedium: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 24,
    lineHeight: 32,
  },
  titleSmall: {
    color: Colors.black,
    fontFamily: Inter.Bold,
    fontSize: 20,
    lineHeight: 28,
  },
  labelSemiBoldLarge: {
    color: Colors.black,
    fontFamily: Inter.SemiBold,
    fontSize: 18,
    lineHeight: 28,
  },
  labelSemiBoldMedium: {
    color: Colors.black,
    fontFamily: Inter.SemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  labelSemiBoldSmall: {
    color: Colors.black,
    fontFamily: Inter.SemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSemiBoldXSmall: {
    color: Colors.black,
    fontFamily: Inter.SemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  labelLarge: {
    color: Colors.black,
    fontFamily: Inter.Medium,
    fontSize: 18,
    lineHeight: 28,
  },
  labelMedium: {
    color: Colors.black,
    fontFamily: Inter.Medium,
    fontSize: 16,
    lineHeight: 24,
  },
  labelSmall: {
    color: Colors.black,
    fontFamily: Inter.Medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelXSmall: {
    color: Colors.black,
    fontFamily: Inter.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
  labelXXSmall: {
    color: Colors.black,
    fontFamily: Inter.Medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  bodyLarge: {
    color: Colors.black,
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMedium: {
    color: Colors.black,
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    color: Colors.black,
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyXSmall: {
    color: Colors.black,
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
  bodyXXSmall: {
    color: Colors.black,
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
})
