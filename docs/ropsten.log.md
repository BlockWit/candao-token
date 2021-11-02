# ROPSTEN test log
## Addresses
* Configurator deployed at address: [0x04b4444e0495c9c97ba62f03a2377c42b7c3cbEB](https://ropsten.etherscan.io/address/0x04b4444e0495c9c97ba62f03a2377c42b7c3cbEB)
* VestingWallet address [0xd7B9e8A168D98d35ECA0a0709C4CcCB4BeB02657](https://ropsten.etherscan.io/address/0xd7B9e8A168D98d35ECA0a0709C4CcCB4BeB02657)
* Token address: [0x107397eFb3530139266b2C4f1f4194e3Df443D03](https://ropsten.etherscan.io/address/0x107397eFb3530139266b2C4f1f4194e3Df443D03)

## Test actions
* VestingWallet. Set balance. Should rewrite target account's balance.  
  Result: successful tx: https://ropsten.etherscan.io/tx/0x18e46604a52a7005e90581cd6d9d3b78fd6fbdd38b8c957ba0ed719c16ca5cbb
* CommonSale. Attemping to add balances from non-owner account. Should revert  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://ropsten.etherscan.io/tx/0x304444575da995e2a841ca42eedf3e60591a8e743017bf1b8c5db292def0521a
* CommonSale. add balances. Should increase target accounts by specified amounts.  
  Result: successful tx: https://ropsten.etherscan.io/tx/0x75c1d6715659e4e4998257db256948c112a41b040881cfa4d6f509bc743a203a
* CommonSale. Attempting to enable withdrawal from non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://ropsten.etherscan.io/tx/0x02f7823a7840c7d3c3dc97c4ffa91eb55ffce3e9420c2a2d33821fedf7ee9d64
* CommonSale. Attempting to withdraw before withdrawal is enabled. Should revert  
  Result: Revert with reason 'VestingWallet: withdrawal is not yet active'. https://ropsten.etherscan.io/tx/0x5aceac4acb40c271faa814c62a29d197c240402fac86d7b78d650bf879f659bb
* CommonSale. Enable withdrawal.  
  Result: successful tx: https://ropsten.etherscan.io/tx/0x5feb72cbdeec2ab82b880079aff2b89a9e1febaf0e0dbc857e3e32e50811a141
* CommonSale. Withdraw from user's account.  
  Result: successful tx: https://ropsten.etherscan.io/tx/0x7adbfc5f002631484eea5c100b89cbdb5e56ee5825988e57c707753233d513cd
