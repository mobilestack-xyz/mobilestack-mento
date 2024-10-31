import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import TabWallet from 'src/tokens/TabWallet'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCkesAddress, mockCkesTokenId, mockCusdAddress, mockCusdTokenId } from 'test/values'

jest.mock('src/statsig')

const storeWithTokenBalances = {
  tokens: {
    tokenBalances: {
      [mockCkesTokenId]: {
        tokenId: mockCkesTokenId,
        priceUsd: '0.0078',
        address: mockCkesAddress,
        symbol: 'cKES',
        imageUrl:
          'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cKES.png',
        name: 'Celo Kenyan Shilling',
        decimals: 18,
        balance: '1000',
        isFeeCurrency: true,
        canTransferWithComment: true,
        priceFetchedAt: Date.now(),
        networkId: NetworkId['celo-alfajores'],
      },
      [mockCusdTokenId]: {
        tokenId: mockCusdTokenId,
        priceUsd: '1.001',
        address: mockCusdAddress,
        symbol: 'cUSD',
        imageUrl:
          'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
        name: 'Celo Dollar',
        decimals: 18,
        balance: '10',
        isFeeCurrency: true,
        canTransferWithComment: true,
        priceFetchedAt: Date.now(),
        networkId: NetworkId['celo-alfajores'],
      },
    },
  },
}

describe('TabWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockRestore()
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showBalances: [NetworkId['celo-alfajores']],
    })
  })
  it('shows correct total balance, cKES and cUSD line items when tokens have balance', () => {
    const {} = render(
      <Provider store={createMockStore(storeWithTokenBalances)}>
        <MockedNavigator component={TabWallet} />
      </Provider>
    )
  })
  it('shows cKES and cUSD line items when tokens do not have balance', () => {})
  it('tapping asset navigates to TokenDetails screen', () => {})
})
