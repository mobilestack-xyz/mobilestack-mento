import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import TabHome from 'src/home/TabHome'
import { RootState } from 'src/redux/reducers'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { RecursivePartial, createMockStore } from 'test/utils'
import { mockCeurAddress, mockCeurTokenId, mockCusdAddress, mockCusdTokenId } from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        decimals: 18,
        balance: '1',
        isFeeCurrency: true,
        priceUsd: '1',
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        priceUsd: '1',
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
}

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchProviders: jest.fn(),
}))

describe('TabHome', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResponse(
      JSON.stringify({
        data: {
          tokenTransactionsV2: {
            transactions: [],
          },
        },
      })
    )
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}, screenParams = {}) {
    const store = createMockStore({
      ...mockBalances,
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={TabHome} params={screenParams} />
      </Provider>
    )

    return {
      store,
      tree,
      ...tree,
    }
  }

  it('renders home tab correctly and fires initial actions', async () => {
    const { store } = renderScreen({
      app: {
        phoneNumberVerified: true,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    await waitFor(() =>
      expect(store.getActions().map((action) => action.type)).toEqual(
        expect.arrayContaining([
          'HOME/VISIT_HOME',
          'HOME/REFRESH_BALANCES',
          'IDENTITY/IMPORT_CONTACTS',
        ])
      )
    )
  })

  it("doesn't import contacts if number isn't verified", async () => {
    const { store } = renderScreen({
      app: {
        phoneNumberVerified: false,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    await waitFor(() =>
      expect(store.getActions().map((action) => action.type)).toEqual(
        expect.arrayContaining(['HOME/VISIT_HOME', 'HOME/REFRESH_BALANCES'])
      )
    )
  })

  it('Tapping add cKES opens the bottom sheet if the user has cUSD', async () => {
    const { getByTestId } = renderScreen()

    fireEvent.press(getByTestId('FlatCard/AddCKES'))
    expect(getByTestId('AddCKESBottomSheet')).toBeVisible()
  })
  it('Tapping add from cusd on the bottom sheet opens the swap screen', async () => {})
  it('Tapping purchase cKES on the bottom sheet opens the cash in flow', async () => {})
  it('Tapping add cKES opens the cash in flow if the user does not have cUSD', async () => {})
  it('Tapping send money opens the send flow', async () => {})
  it('Tapping receive money opens the QR code screen', async () => {})
  it('Tapping hold USD opens the swap screen', async () => {})
  it('Tapping withdraw opens the withdraw screen', async () => {})
})
