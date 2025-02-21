import { Core } from '@walletconnect/core'
import Client from '@walletconnect/sign-client'
import { E2E_WALLET_CONNECT_PROJECT_ID } from 'react-native-dotenv'
import {
  createPublicClient,
  hashMessage,
  hexToNumber,
  http,
  verifyMessage,
  verifyTypedData,
} from 'viem'
import { parseTransaction } from 'viem/celo'
import { celo } from 'viem/chains'
import { sleep } from '../../../src/utils/sleep'
import WALLET_ADDRESS from '../utils/consts'
import { formatUri, utf8ToHex } from '../utils/encoding'
import { launchApp } from '../utils/retries'
import { enterPinUiIfNecessary, waitForElementByIdAndTap } from '../utils/utils'

import jestExpect from 'expect'

const dappName = 'WalletConnectV2 E2E'
const walletAddress = (WALLET_ADDRESS || '0xebf95355cc5ea643179a02337f3f943fd8dd2bcb').toLowerCase()

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

async function formatTestTransaction(address) {
  try {
    const nonce = await client.getTransactionCount({ address })
    return {
      from: address,
      to: address,
      data: '0x',
      nonce,
      gas: '0x5208',
      maxFeePerGas: '0x1DCD65000',
      maxPriorityFeePerGas: '0x77359400',
      value: '0x01',
    }
  } catch (error) {
    throw new Error(`Failed to create test tx with error ${error.toString()}`)
  }
}

const verifySuccessfulConnection = async () => {
  await waitFor(element(by.text(`Success! Please go back to ${dappName} to continue`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await waitForElementByIdAndTap('Tab/Wallet')
  await waitFor(element(by.id('TabWallet')))
    .toBeVisible()
    .withTimeout(15 * 1000)
}

const verifySuccessfulSign = async (title = 'Verify wallet') => {
  await waitFor(element(by.text(title)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await waitFor(element(by.text(`${dappName} would like to verify ownership of your wallet.`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await element(by.text('Allow')).tap()
  await enterPinUiIfNecessary()
  await verifySuccessfulConnection()
}

const verifySuccessfulTransaction = async (title = 'Confirm transaction', tx) => {
  await waitFor(element(by.text(title)))
    .toBeVisible()
    .withTimeout(15 * 1000)

  await element(by.id('WalletConnectActionRequest/Allow')).tap()
  await enterPinUiIfNecessary()
  await verifySuccessfulConnection()
}

export default WalletConnect = () => {
  let walletConnectClient, pairingUrl, core
  let intervalsToClear = []

  beforeAll(async () => {
    // @walletconnect/heartbeat keeps a setInterval running, which causes jest to hang, unable to shut down cleanly
    // https://github.com/WalletConnect/walletconnect-utils/blob/4484e47f24a5a82078c27a0cf0185db921cf60d7/misc/heartbeat/src/heartbeat.ts#L47
    // As a workaround, since no reference to the interval is kept, we capture them
    // during the WC client init, and then clear them after the test is done
    // Note: this is a hack, and should be removed once @walletconnect/heartbeat is fixed
    const originalSetInterval = global.setInterval
    const originalAbortController = global.AbortController
    global.setInterval = (...args) => {
      const id = originalSetInterval(...args)
      intervalsToClear.push(id)
      return id
    }
    // This is fixed in Jest 27, but we're still on 26
    const abortFn = jest.fn()
    global.AbortController = jest.fn(() => ({
      abort: abortFn,
    }))

    core = await Core.init({
      projectId: E2E_WALLET_CONNECT_PROJECT_ID,
      relayUrl: 'wss://relay.walletconnect.org',
    })

    walletConnectClient = await Client.init({
      core,
      metadata: {
        name: dappName,
        description: 'WalletConnect Client',
        url: 'https://valoraapp.com/',
        icons: [],
      },
    })

    // Now restore the original setInterval
    global.setInterval = originalSetInterval
    global.AbortController = originalAbortController

    const { uri } = await walletConnectClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          chains: ['eip155:42220'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    })

    pairingUrl = formatUri(uri)
  })

  beforeEach(async () => {
    // wait for any banners to disappear
    await sleep(5000)
  })

  afterAll(async () => {
    // Clear the captured intervals and the transport (connection), so jest can shut down cleanly
    intervalsToClear.forEach((id) => clearInterval(id))
    await walletConnectClient.core.relayer.transportClose()
  })

  it('Then is able to establish a session', async () => {
    if (device.getPlatform() === 'android') {
      await launchApp({ url: pairingUrl })
    } else {
      await device.openURL({ url: pairingUrl })
    }

    await waitFor(element(by.id('WalletConnectSessionRequestHeader')))
      .toBeVisible()
      .withTimeout(30 * 1000)

    await element(by.text('Connect wallet')).tap()
    await verifySuccessfulConnection()
  })

  it(
    'Then is able to send a transaction (eth_sendTransaction)',
    async () => {
      const tx = await formatTestTransaction(walletAddress)
      const [session] = walletConnectClient.session.map.values()
      const requestPromise = walletConnectClient.request({
        topic: session.topic,
        chainId: 'eip155:42220',
        request: {
          method: 'eth_sendTransaction',
          params: [tx],
        },
      })

      await waitFor(element(by.text(new RegExp(`^${dappName} would like to send a transaction.*`))))
        .toBeVisible()
        .withTimeout(15 * 1000)
      await verifySuccessfulTransaction('Send transaction', tx)

      const txHash = await requestPromise
      console.log('Received tx hash', txHash)

      const receipt = await client.waitForTransactionReceipt({ hash: txHash })
      console.log('Received receipt', receipt)
      jestExpect(receipt).toBeTruthy()
      const { status, from, to } = receipt

      jestExpect(status).toStrictEqual('success')
      jestExpect(from).toStrictEqual(walletAddress)
      jestExpect(to).toStrictEqual(walletAddress)
    },
    // Increase timeout for this test, since it's waiting for a transaction to be mined
    60 * 1000
  )

  it('Then is able to sign a transaction (eth_signTransaction)', async () => {
    const tx = await formatTestTransaction(walletAddress)
    const [session] = walletConnectClient.session.map.values()
    const requestPromise = walletConnectClient.request({
      topic: session.topic,
      chainId: 'eip155:42220',
      request: {
        method: 'eth_signTransaction',
        params: [tx],
      },
    })

    await waitFor(element(by.text(new RegExp(`^${dappName} would like to sign a transaction.*`))))
      .toBeVisible()
      .withTimeout(15 * 1000)

    await verifySuccessfulTransaction('Sign transaction', tx)

    const signedTx = await requestPromise
    console.log('Received signed tx', signedTx)

    // TODO: assert transaction signer address once Viem could provide it
    const recoveredTx = parseTransaction(signedTx)
    jestExpect(recoveredTx.nonce).toEqual(hexToNumber(tx.nonce))
    jestExpect(recoveredTx.to).toEqual(tx.to)
    jestExpect(recoveredTx.value).toEqual(BigInt(tx.value))
  })

  it('Then is able to sign a message (eth_sign)', async () => {
    const message = hashMessage(`My email is valora.test@mailinator.com - ${+new Date()}`)
    const params = [walletAddress, message]
    const [session] = walletConnectClient.session.map.values()
    const requestPromise = walletConnectClient.request({
      topic: session.topic,
      chainId: 'eip155:42220',
      request: {
        method: 'eth_sign',
        params,
      },
    })

    await verifySuccessfulSign()

    const signature = await requestPromise
    console.log('Received signature', signature)

    const isValidSignature = await verifyMessage({
      message: {
        raw: message,
      },
      signature,
      address: walletAddress,
    })
    jestExpect(isValidSignature).toStrictEqual(true)
  })

  it('Then is able to sign a personal message (personal_sign)', async () => {
    const message = `My email is valora.test@mailinator.com - ${+new Date()}`
    const params = [utf8ToHex(message), walletAddress]
    const [session] = walletConnectClient.session.map.values()
    const requetPromise = walletConnectClient.request({
      topic: session.topic,
      chainId: 'eip155:42220',
      request: {
        method: 'personal_sign',
        params,
      },
    })

    await verifySuccessfulSign()

    const signature = await requetPromise
    console.log('Received signature', signature)

    const isValidSignature = await verifyMessage({
      message,
      signature,
      address: walletAddress,
    })
    jestExpect(isValidSignature).toStrictEqual(true)
  })

  it('Then is able to sign typed data (eth_signTypedData)', async () => {
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
          { name: 'other', type: 'OtherTypes' },
        ],
        // Ensure some "less" common types are supported
        OtherTypes: [
          { name: 'ui8', type: 'uint8' },
          { name: 'ui160', type: 'uint160' },
          { name: 'i8', type: 'int8' },
          { name: 'i160', type: 'int160' },
          { name: 'b1', type: 'bytes1' },
          { name: 'b17', type: 'bytes17' },
          { name: 'b32', type: 'bytes32' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
        to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
        contents: 'Hello, Bob!',
        other: {
          ui8: 250,
          ui160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          i8: -120,
          i160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          b1: '0x01',
          b17: '0x0102030405060708090a0b0c0d0e0f1011',
          b32: '0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        },
      },
    }
    const params = [walletAddress, JSON.stringify(typedData)]
    const [session] = walletConnectClient.session.map.values()
    const requestPromise = walletConnectClient.request({
      topic: session.topic,
      chainId: 'eip155:42220',
      request: {
        method: 'eth_signTypedData',
        params,
      },
    })

    await verifySuccessfulSign()

    const signature = await requestPromise
    console.log('Received signature', signature)

    const isValidSignature = await verifyTypedData({
      ...typedData,
      address: walletAddress,
      signature,
    })
    jestExpect(isValidSignature).toStrictEqual(true)
  })

  it('Then should be able to disconnect a session', async () => {
    await waitForElementByIdAndTap('TabHeader/SettingsGearButton')
    await element(by.id('SettingsMenu/ConnectedDapps')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await element(by.id('BackChevron')).tap()
    await expect(element(by.id('SettingsMenu/ConnectedDapps/value'))).toHaveText('0')
  })
}
