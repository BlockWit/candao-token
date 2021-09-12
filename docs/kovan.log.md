# KOVAN test log
## Addresses
* Configurator deployed at address: [0x27Da648FdC1ED5B73f4a6719372F32770E74cE7c](https://kovan.etherscan.io/address/0x27Da648FdC1ED5B73f4a6719372F32770E74cE7c)
* Sale address [0xa2075C82b1d438bf87f51DE5CB2DcEb797Be9a6F](https://kovan.etherscan.io/address/0xa2075C82b1d438bf87f51DE5CB2DcEb797Be9a6F)
* Token address: [0x505F8c8897237bCc7E5F55729B684E0B78a84828](https://kovan.etherscan.io/address/0x505F8c8897237bCc7E5F55729B684E0B78a84828)

## Test actions

1. CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.  
  Result: Revert with reason 'StagedCrowdsale: No suitable stage found'. https://kovan.etherscan.io/tx/0x49999224a8ff07c6d289c86c6c48762bafeb891cd49de09a04a13dd66d356ac3
3. CommonSale. Change the beginning time of the first stage.  
  Result: successful tx: https://kovan.etherscan.io/tx/0xc00b0c300a9e100f73e9ed7e1ab117e19eb989657b0014b3372e49432f551059
4. CommonSale. Attempting to send less than the allowed amount of Eth. Should revert.  
  Result: Revert with reason 'CommonSale: The amount of ETH you sent is too small'. https://kovan.etherscan.io/tx/0x2adc3897f322ac71b1d25bd3402a30dc3f45d52d8ef41926354b8f64609b6642
5. CommonSale. Send 0.03 Eth from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x617f2f81bbb9d71daf703778150f2c32bb79be9f468e040b03b286b625586ec4
6. CommonSale. Send 0.09 Eth from buyer's account. Specify CDO referral.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x1acfdfe524aaa09d1cacf31de6c38e3762392ccbe7af68a0c4326ed28e428b48
7. CommonSale. Send 0.09 Eth from buyer's account. Specify ETH referral.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x5effcf481c777295f6be1a8b03a7b31fdf9e94c390749ea1fb27580f96363018
8. CommonSale. Attempting to enable withdrawal from non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0x0f724ccd3c8ca6bfc0f207819b058fa4f016d375f83a91084f79835d24995e99
9. CommonSale. Attempting to withdraw before withdrawal is enabled. Should revert.  
  Result: Revert with reason 'CommonSale: withdrawal is not yet active'. https://kovan.etherscan.io/tx/0xde2b330ae0653988abf8e3caceef3e1ee62865a1703d5b6c125c5b477f2e3aa0
10. CommonSale. Enable withdrawal.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x0e0ca7b0be55eb2cf90c71d8ef7539f5d56b30760a29ba71ea9e4566ee4e5109
11. CommonSale. Withdraw from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x5da1e6ad9a64d9a68067618f89f4e70ce031dfb75b53aff27d7d4a4f9b303c17
12. CommonSale. Withdraw from referral's account.
  Result: successful tx: https://kovan.etherscan.io/tx/0xc7f4a09822f8d9ebde4757787592e36be7e7e88b8a0e546345f58ef17db2443a
13. Token. Transfer from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x3e6732bda787f073b755c8645fb84428018310f78a4bceab26447439dd46b7b7
14. CommonSale. Attemping to set balance from non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0xc37cb144c8312409b21bca09d656d836e25c972b540e4db94c8cf6a52ebc755a
15. CommonSale. Set balance. Should rewrite target account's balance.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x527477f6243e31ace8a0916a1b5fec30389c94954b17caacb241a251e900d0ee
16. CommonSale. Attemping to add balances from non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0xc052bcc627108ed44d30d35c7652d2dbdc2489e1522ad1c42cd726e1f5f15836
17. CommonSale. add balances. Should increase target accounts by specified amounts.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x0e7720168c06deb22d517d39c1c9ed522315eecbf4172dfd08cf734851d06645
