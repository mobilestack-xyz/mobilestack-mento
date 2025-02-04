import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import WelcomeLogo from 'src/images/WelcomeLogo'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => navigateHome(), 3000)
    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <WelcomeLogo />
      <Text style={styles.text}>{t('success.message')}</Text>
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000D5A',
  },
  text: {
    ...typeScale.titleMedium,
    color: colors.white,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
  },
})

export default OnboardingSuccessScreen
