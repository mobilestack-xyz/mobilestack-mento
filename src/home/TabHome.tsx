import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import { appStateSelector, phoneNumberVerifiedSelector } from 'src/app/selectors'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import { refreshAllBalances, visitHome } from 'src/home/actions'
import ArrowVertical from 'src/icons/ArrowVertical'
import Send from 'src/icons/Send'
import Swap from 'src/icons/Swap'
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
import { useTokenInfo } from 'src/tokens/hooks'
import { hasGrantedContactsPermission } from 'src/utils/contacts'

type Props = NativeStackScreenProps<StackParamList, Screens.TabHome>

function TabHome(_props: Props) {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector(phoneNumberVerifiedSelector)

  const dispatch = useDispatch()

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

  const cKESToken = useTokenInfo('celo-mainnet:0x456a3d042c0dbd3db53d5489e98dfb038553b0d0')

  function onPressAddCKES() {
    navigate(Screens.FiatExchangeAmount, {
      tokenId: cKESToken?.tokenId,
    })
  }

  if (!cKESToken) {
    return null
  }

  return (
    <SafeAreaView testID="WalletHome" style={styles.container} edges={[]}>
      <FlatCard onPress={onPressAddCKES}>
        <View style={styles.column}>
          <TokenIcon token={cKESToken} showNetworkIcon={false} size={IconSize.LARGE} />
          <Text style={styles.labelSemiBoldMedium}>Add cKES</Text>
        </View>
      </FlatCard>
      <View style={styles.row}>
        <View style={styles.flex}>
          <FlatCard>
            <View style={styles.column}>
              <Send />
              <Text style={styles.labelSemiBoldMedium}>Send Money</Text>
            </View>
          </FlatCard>
        </View>
        <View style={styles.flex}>
          <FlatCard>
            <View style={styles.column}>
              <ArrowVertical />
              <Text style={styles.labelSemiBoldMedium}>Recieve Money</Text>
            </View>
          </FlatCard>
        </View>
      </View>
      <FlatCard>
        <View style={styles.row}>
          <Swap />
          <View style={styles.flex}>
            <Text style={styles.labelSemiBoldMedium}>Hold US Dollars</Text>
            <Text style={styles.bodySmallGray}>Swap your cKES for cUSD</Text>
          </View>
        </View>
      </FlatCard>
      <FlatCard>
        <View style={styles.row}>
          <Withdraw />
          <Text style={styles.labelSemiBoldMedium}>Withdraw From Your Wallet</Text>
        </View>
      </FlatCard>
    </SafeAreaView>
  )
}

function FlatCard({ onPress, ...props }: { children: React.ReactNode; onPress: () => void }) {
  return <Touchable style={styles.flatCard} onPress={onPress} {...props} />
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
})

export default TabHome
