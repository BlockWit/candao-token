module.exports = {
  accounts: {
    ether: 10000000, // Initial balance of unlocked accounts (in ether)
  },
  contracts: {
    defaultGas: 20e6, // Maximum gas for contract calls (when unspecified)
  },
  node: { // Options passed directly to Ganache client
    gasLimit: 20e6, // Maximum gas per block
    unlocked_accounts: [
      '0x68CE6F1A63CC76795a70Cf9b9ca3f23293547303',
      '0x44C4A8d57B22597a2c0397A15CF1F32d8A4EA8F7',
      '0x6E9DC3D20B906Fd2B52eC685fE127170eD2165aB',
      '0x91E84302594deFaD552938B6D0D56e9f39908f9F',
      '0x7BD3b301f3537c75bf64B7468998d20045cfa48e'
    ]
  }
};
