module.exports = {
  accounts: {
    ether: 10000000 // Initial balance of unlocked accounts (in ether)
  },
  contracts: {
    defaultGas: 20e6 // Maximum gas for contract calls (when unspecified)
  },
  node: { // Options passed directly to Ganache client
    gasLimit: 20e6 // Maximum gas per block
  }
};
