import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import { hideWalletBalancesSelector } from 'src/app/selectors'
import { HideBalanceButton } from 'src/components/TokenBalance'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTotalTokenBalance } from 'src/tokens/hooks'
import { sortedCkesandCusdSelector } from 'src/tokens/selectors'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { getSupportedNetworkIdsForTokenBalances, getTokenAnalyticsProps } from 'src/tokens/utils'

function TabWallet() {
  const hideWalletBalances = useSelector(hideWalletBalancesSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { decimalSeparator } = getNumberFormatSettings()

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector((state) => sortedCkesandCusdSelector(state, supportedNetworkIds))
  const totalTokenBalanceLocal = useTotalTokenBalance()
  const balanceDisplay = hideWalletBalances
    ? `XX${decimalSeparator}XX`
    : totalTokenBalanceLocal?.toFormat(2)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.row}>
        <Text style={styles.totalBalance} testID={'TotalTokenBalance'}>
          {!hideWalletBalances && localCurrencySymbol}
          {balanceDisplay}
        </Text>
        <HideBalanceButton hideBalance={hideWalletBalances} />
      </View>
      <ScrollView>
        {tokens.map((token, index) => (
          <TokenBalanceItem
            token={token}
            key={index}
            onPress={() => {
              navigate(Screens.TokenDetails, { tokenId: token.tokenId })
              AppAnalytics.track(AssetsEvents.tap_asset, {
                ...getTokenAnalyticsProps(token),
                title: token.symbol,
                description: token.name,
                assetType: 'token',
              })
            }}
            hideBalances={hideWalletBalances}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.Large32,
  },
  totalBalance: {
    ...typeScale.titleLarge,
    color: Colors.black,
  },
  tokenBalanceItemContainer: {
    marginHorizontal: Spacing.Thick24,
  },
})

export default TabWallet
