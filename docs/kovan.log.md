# KOVAN test log
## Addresses
* Configurator deployed at address: [0xb686d5c0a1483cf582386EB607aDE74a79363B7c](https://kovan.etherscan.io/address/0xb686d5c0a1483cf582386EB607aDE74a79363B7c)
* Sale address [0x5c09A0c9D197a9178f5e254F1975228e5709aBBC](https://kovan.etherscan.io/address/0x5c09A0c9D197a9178f5e254F1975228e5709aBBC)
* Token address: [0x9C82fC6091599928d0Fa998e181EeCb4562f9857](https://kovan.etherscan.io/address/0x9C82fC6091599928d0Fa998e181EeCb4562f9857)

* Wallets:
    * [SEED 2](https://kovan.etherscan.io/address/0x0aC2F917aa917B31AC74A06dC2EfE0Ba44cbF053)
    * [SEED 3](https://kovan.etherscan.io/address/0x0c3BA9CDA61e7198d6959359F44BCdD696182872)
    * [DAO 1](https://kovan.etherscan.io/address/0x336329E87Ca6d6e1FB856426E7797fe706af3e2E)
    * [FOUNDATION 2](https://kovan.etherscan.io/address/0x473c0B1D8c9cF64cE685F62d26b5d9aBC9Bf84a8)
    * [MARKETING 1](https://kovan.etherscan.io/address/0x96BeBBb89a61a75812226d21da790f5ce4A205B6)

## Test actions

1. CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.  
    Result: [Revert with reason "StagedCrowdsale: No suitable stage found"](https://kovan.etherscan.io/tx/0xc8ec78acda4ae7eabe517065150cb669115da1e77b88d80d4697d2212e3ef66e)
2. CommonSale. Attempting to call "updateStage" method from a non-owner account. Should revert.  
    Result: [Revert with reason "Ownable: caller is not the owner"](https://kovan.etherscan.io/tx/0xd2a1d7d713ab2cfd97b023adb4e9988d29040b8ee5e1c6adcd5a7bc72b1ff51f)
3. CommonSale. Change the beginning time of the first stage.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0xcf5d096268b85b8ac0f7a552401263fa76ca5189d03e2cdc32ae481f5b7c6b49)
4. CommonSale. Attempting to send less than the allowed amount of Eth. Should revert.  
    Result: [Revert with reason "CommonSale: The amount of ETH you sent is too small"](https://kovan.etherscan.io/tx/0x3913447c440669ace7f28ef3ed3695c4e37392517256904f8873b210ecfc7d23)
5. CommonSale. Send 0.03 Eth from buyer's account.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0x0f46ca1a94441c933d5966f7dc402d5d461b6aea9e518116cf50be52d3b4a358)
6. Token. Attempting to transfer token before it's unpaused. Should revert.  
    Result: [Revert with reason "Pausable: paused"](https://kovan.etherscan.io/tx/0xee388874926929f8c6942ba2e0a898b98c6b447e92bec47fc615b0b88911c5d8)
7. Token. Attempting to call "unpause" method from a non-owner account. Should revert.  
    Result: [Revert with reason "Ownable: caller is not the owner"](https://kovan.etherscan.io/tx/0x98ab1f1c76a732ad5a759ec12579b82c8e59fd9a590022afc5fb07380f1e8a75)
8. Token. Unpause.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0x217e1f2ae9a6b5f421d023b8e4533e010ed8ca42b1b996adb09a1b9eb79d89d7)
9. Token. Transfer 0 CDO from seed2's account after token's been unpaused.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0xd40284aa95e2b95b72dda8e1154ef0cbfebdaadb9e70b90e4913a8d60eadaa0b)
10. Token. Transfer 3901.32 CDO from buyer's account after token's been unpaused.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0xf29a8f7499b6d5ff5b642f777df8e93de39ef90ee6cd7927a0213b1066dbe574)
11. FreezeTokenWallet. Attempting to withdraw tokens ahead of schedule. Should revert.  
    Result: [Revert with reason "Freezing period has not started yet"](https://kovan.etherscan.io/tx/0x4db4291720f7827eabd788c2a76bc3c4ef28e9d79d2216d29a265e2bea24195a)
12. CommonSale. Send 0.1 Eth from deployer's account.  
   Result: [successful tx](https://kovan.etherscan.io/tx/0xca1662be70c91fdb7821d0c0fe98999bd5b305472882f6a99330675333dee5bb)
13. CommonSale. Set the price at 21453.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0x4901a3efd46ba2cdbe621d80ad1100c62f284c6c3547bf3012c24143cde43b6c)
14. CommonSale. Send 0.1 Eth from deployer's account after price's been changed.  
    Result: [successful tx](https://kovan.etherscan.io/tx/0x6960e31257b856b473ef54800b4f17a545a734b295409b6029be387238ce67e4)
15. CommonSale. Withdraw all tokens from CommonSale's address by owner.
    Result: [successful tx](https://kovan.etherscan.io/tx/0x96584e3e7c3cdb53b3a6e225f53d983ec03ef6bcbd4ec17478f3481e156faa83)
16. CommonSale. Put back all tokens to CommonSale's address.
    Result: [successful tx](https://kovan.etherscan.io/tx/0xe1c07f52587162b04283bdb8e9a3023db6ab9706b4cf6b1f1946934e0eac7bad)
12. CommonSale. Send 0.1 Eth from deployer's account.
    Result: [successful tx](https://kovan.etherscan.io/tx/0xe1c07f52587162b04283bdb8e9a3023db6ab9706b4cf6b1f1946934e0eac7bad)
