# KOVAN test log
## Addresses
* Configurator deployed at address: [0x7ADC60237c1Aa306c517C8e5ffd07044c90e544C](https://kovan.etherscan.io/address/0x7ADC60237c1Aa306c517C8e5ffd07044c90e544C)
* Sale address [0x7d7235c1c2d8455EcF12ABdb167bc224BBC75416](https://kovan.etherscan.io/address/0x7d7235c1c2d8455EcF12ABdb167bc224BBC75416)
* Token address: [0x413d33e2704dA1776f9b5BD4f59c6347Fe30C7f9](https://kovan.etherscan.io/address/0x413d33e2704dA1776f9b5BD4f59c6347Fe30C7f9)

## Test actions
* CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.  
  Result: Revert with reason 'StagedCrowdsale: No suitable stage found'. https://kovan.etherscan.io/tx/0x27687a39043ac42383f2bd9e426c46115ec3f8d1511daf88fd670eaa1f8b603b
* CommonSale. Attempting to call 'updateStage' method from a non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0xff658495428a34c801b66aa1e1ba9566a2a1292056a2b46c13a46dc333d585fd
* CommonSale. Change the beginning time of the first stage.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x4d0bcf7e982e21dbd1bb76cea455f241f95b299188a81483743a634aac33111d
* CommonSale. Attempting to send less than the allowed amount of Eth. Should revert.  
  Result: Revert with reason 'CommonSale: The amount of ETH you sent is too small.'. https://kovan.etherscan.io/tx/0x09fef582c45329deb4e2a0a67dc2d0e2fafc417ad789f74e9d5df5352bf91ede
* CommonSale. Send 0.03 Eth from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x650da9d9348ede3727d65901118cbfbde97d5adb6ccbacf2b11817847b6850f6
* CommonSale. Send 0.09 Eth from buyer's account. Specify CDO referral.  
  Result: successful tx: https://kovan.etherscan.io/tx/0xef825e10c26fc519cbba7e0099081d2eee37522beed50882a017fd5f1b5cee6b
* CommonSale. Send 0.09 Eth from buyer's account. Specify ETH referral.  
  Result: successful tx: https://kovan.etherscan.io/tx/0xa574cb57182ae15f1fe9d7a33b0cc730e0d2c1069f390246dfb2afc9989fa7a2
* CommonSale. Attempting to enable withdrawal from non-owner account. Should revert.  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0xf86d74c400f77d73cecda82245fef2c6e545fd8c9c6d7f6b1adbef67cf01a33d
* CommonSale. Attempting to withdraw before withdrawal is enabled. Should revert  
  Result: Revert with reason 'CommonSale: withdrawal is not yet active'. https://kovan.etherscan.io/tx/0x6ebe614b10b7a8285f3ef6ba752be8f54c383453b1aae7de0b0fd7dd05d90ebd
* CommonSale. Enable withdrawal.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x90af07c447127145ee366a833533ff9cc3625564810ef40a9bf3f7e1ebd10c68
* CommonSale. Withdraw from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x74b8a1bbf6aa364028359f51f863643f2ea739cac502609671383c70a59f41cd
* CommonSale. Withdraw from referral's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0xfa5b6f2a9638a2340174cd7cd99450b3bc7022ceb6b1f3407ce026c1aa69ac2f
* Token. Transfer from buyer's account.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x0edf3c4102ba9b32045714f410e29483fe760fb6799600811b7d1537484e668f
* CommonSale. Attemping to set balance from non-owner account. Should revert  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0x7d80ae43eef76fa74ecc6b91622f9739ebb281da5e347308c0679d8d4fb52fa4
* CommonSale. Set balance. Should rewrite target account's balance.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x8688696894df17f5d1841c8f0d00ae80de68f4be6c709abfa2e7d38e5f97021c
* CommonSale. Attemping to add balances from non-owner account. Should revert  
  Result: Revert with reason 'Ownable: caller is not the owner'. https://kovan.etherscan.io/tx/0xe9e4a1b047f6b7e90915c12cbde352e015278cf22e9b21e51ee193b37bb17b72
* CommonSale. add balances. Should increase target accounts by specified amounts.  
  Result: successful tx: https://kovan.etherscan.io/tx/0x98049090549a030161520d8f324b1802e3ddceadca1545886c2c2a019e55634d
