import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import { appStateSelector, phoneNumberVerifiedSelector } from 'src/app/selectors'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { refreshAllBalances, visitHome } from 'src/home/actions'
import ArrowVertical from 'src/icons/ArrowVertical'
import Add from 'src/icons/quick-actions/Add'
import Send from 'src/icons/Send'
import Swap from 'src/icons/Swap'
import SwapArrows from 'src/icons/SwapArrows'
import Withdraw from 'src/icons/Withdraw'
import { importContacts } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { initializeSentryUserContext } from 'src/sentry/actions'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useCKES, useCUSD } from 'src/tokens/hooks'
import { hasGrantedContactsPermission } from 'src/utils/contacts'

type Props = NativeStackScreenProps<StackParamList, Screens.TabHome>

function TabHome(_props: Props) {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector(phoneNumberVerifiedSelector)

  const dispatch = useDispatch()
  const addCKESBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  useEffect(() => {
    dispatch(visitHome())
  }, [])

  const showTestnetBanner = () => {
    dispatch(
      showMessage(
        t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
        ALERT_BANNER_DURATION,
        null,
        null,
        t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
      )
    )
  }

  const tryImportContacts = async () => {
    // Skip if contacts have already been imported or the user hasn't verified their phone number.
    if (Object.keys(recipientCache).length || !isNumberVerified) {
      return
    }

    const contactPermissionStatusGranted = await hasGrantedContactsPermission()
    if (contactPermissionStatusGranted) {
      dispatch(importContacts())
    }
  }

  useEffect(() => {
    // TODO find a better home for this, its unrelated to wallet home
    dispatch(initializeSentryUserContext())
    if (SHOW_TESTNET_BANNER) {
      showTestnetBanner()
    }

    // Waiting 1/2 sec before triggering to allow
    // rest of feed to load unencumbered
    setTimeout(tryImportContacts, 500)
  }, [])

  useEffect(() => {
    if (appState === AppState.Active) {
      dispatch(refreshAllBalances())
    }
  }, [appState])

  const cKESToken = useCKES()
  const cUSDToken = useCUSD()

  function onPressAddCKES() {
    if (cUSDToken.balance.isZero()) {
      navigate(Screens.FiatExchangeAmount, {
        tokenId: cKESToken.tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: cKESToken.symbol,
      })
    } else {
      addCKESBottomSheetRef.current?.snapToIndex(0)
    }
  }

  function onPressSendMoney() {
    navigate(Screens.SendSelectRecipient, {
      defaultTokenIdOverride: cKESToken.tokenId,
    })
  }

  function onPressRecieveMoney() {
    navigate(Screens.QRNavigator, {
      screen: Screens.QRCode,
    })
  }

  function onPressHoldUSD() {
    navigate(Screens.SwapScreenWithBack, {
      fromTokenId: cKESToken.tokenId,
      toTokenId: cUSDToken.tokenId,
    })
  }

  function onPressWithdraw() {
    navigate(Screens.WithdrawSpend)
  }

  return (
    <SafeAreaView testID="WalletHome" style={styles.container} edges={[]}>
      <FlatCard testID="FlatCard/AddCKES" onPress={onPressAddCKES}>
        <View style={styles.column}>
          <TokenIcon token={cKESToken} showNetworkIcon={false} size={IconSize.LARGE} />
          <Text style={styles.labelSemiBoldMedium}>Add cKES</Text>
        </View>
      </FlatCard>
      <View style={styles.row}>
        <View style={styles.flex}>
          <FlatCard testID="FlatCard/SendMoney" onPress={onPressSendMoney}>
            <View style={styles.column}>
              <Send />
              <Text style={styles.labelSemiBoldMedium}>Send Money</Text>
            </View>
          </FlatCard>
        </View>
        <View style={styles.flex}>
          <FlatCard testID="FlatCard/RecieveMoney" onPress={onPressRecieveMoney}>
            <View style={styles.column}>
              <ArrowVertical />
              <Text style={styles.labelSemiBoldMedium}>Recieve Money</Text>
            </View>
          </FlatCard>
        </View>
      </View>
      <FlatCard testID="FlatCard/HoldUSD" onPress={onPressHoldUSD}>
        <View style={styles.row}>
          <Swap />
          <View style={styles.flex}>
            <Text style={styles.labelSemiBoldMedium}>Hold US Dollars</Text>
            <Text style={styles.bodySmallGray}>Swap your cKES for cUSD</Text>
          </View>
        </View>
      </FlatCard>
      <FlatCard testID="FlatCard/Withdraw" onPress={onPressWithdraw}>
        <View style={styles.row}>
          <Withdraw />
          <Text style={styles.labelSemiBoldMedium}>Withdraw From Your Wallet</Text>
        </View>
      </FlatCard>
      <AddCKESBottomSheet forwardedRef={addCKESBottomSheetRef} />
    </SafeAreaView>
  )
}

function FlatCard({
  onPress,
  testID,
  ...props
}: {
  children: React.ReactNode
  onPress: () => void
  testID: string
}) {
  return <Touchable style={styles.flatCard} testID={testID} onPress={onPress} {...props} />
}

function AddCKESBottomSheet({
  forwardedRef,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const cKESToken = useCKES()
  const cUSDToken = useCUSD()

  function onPressSwapFromCusd() {
    navigate(Screens.SwapScreenWithBack, {
      fromTokenId: cUSDToken.tokenId,
      toTokenId: cKESToken.tokenId,
    })
    forwardedRef.current?.dismiss()
  }

  function onPressPurchaseCkes() {
    navigate(Screens.FiatExchangeAmount, {
      tokenId: cKESToken.tokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: cKESToken.symbol,
    })
    forwardedRef.current?.dismiss()
  }

  return (
    <BottomSheet title="Add cKES" forwardedRef={forwardedRef} testId="AddCKESBottomSheet">
      <View style={styles.bottomSheetContainer}>
        <FlatCard testID="FlatCard/AddFromCUSD" onPress={onPressSwapFromCusd}>
          <View style={styles.row}>
            <SwapArrows />
            <View style={styles.flex}>
              <Text style={styles.labelMedium}>From My cUSD Balance</Text>
              <Text style={styles.bodySmall}>Add cKES by swapping from your cUSD</Text>
            </View>
          </View>
        </FlatCard>
        <FlatCard testID="FlatCard/PurchaseCKES" onPress={onPressPurchaseCkes}>
          <View style={styles.row}>
            <Add color={Colors.black} />
            <View style={styles.flex}>
              <Text style={styles.labelMedium}>Purchase cKES</Text>
              <Text style={styles.bodySmall}>
                Add cKES by purchasing through one of our trusted providers
              </Text>
            </View>
          </View>
        </FlatCard>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: Spacing.Regular16,
    gap: Spacing.Regular16,
  },
  flatCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderColor: Colors.black,
    borderWidth: 1,
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.Smallest8,
  },
  labelSemiBoldMedium: {
    ...typeScale.labelSemiBoldMedium,
  },
  bodySmallGray: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Regular16,
  },
  flex: {
    flex: 1,
  },
  bottomSheetContainer: {
    gap: Spacing.Regular16,
    paddingVertical: Spacing.Thick24,
  },
  labelMedium: {
    ...typeScale.labelMedium,
  },
  bodySmall: {
    ...typeScale.bodySmall,
  },
})

export default TabHome
