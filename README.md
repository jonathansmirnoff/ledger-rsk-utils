# Ledger RSK Utils

This project contains scripts that are useful to interact with RSK node using Ledger.

### Configuration

- rskNode: RSK node url
- valueToSend: value to transfer
- gas: gas to be used for the transfer
- to: destination address
- chainId: chain id for RSK network
- derivationPath: derivation path for RSK network.

**RSK Chain IDs**
- RSK Mainnet: 30
- RSK Testnet: 31

**RSK Derivation Paths**
- RSK MainNet: m / 44' / 137' / 0' / 0 / N
- RSK TestNet: m / 44' / 37310' / 0' / 0 / N
- RSK MainNet - BTC - Legacy: m / 44' / 0' / 0' / 0 / N
- RSK TestNet - BTC - Legacy: m / 44' / 0' / 1' / 0 / N

Example configuration for RSK TestNet is `44'/37310'/0'/0/0`

### Usage
`node sendTs.js`