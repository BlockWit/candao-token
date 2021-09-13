![Candao](logo.png "Candao Token")

# Candao smart contracts

* _Standart_        : [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md)
* _[Name](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#name)_            : Candao
* _[Ticker](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#symbol)_          : CDO
* _[Decimals](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals)_        : 18
* _Emission_        : One-time, 1 500 000 000 tokens
* _Fiat dependency_ : No
* _Token offers_    : 1
* _Token locks_     : Yes

## Smart contracts description

Candao smart-contract

### Contracts
1. _Configurator_
2. _CandaoToken_ - Token contract
3. _Sale_ - Sale contract

### Token distribution
1. _DAO_: 400 000 000
2. _Sales_: 250 000 000
3. _Content Mining_: 210 000 000
4. _Liquidity pool_: 200 000 000
5. _Foundation_: 150 000 000
6. _Team_: 150 000 000
7. _Marketing_: 100 000 000
8. _Advisors_: 40 000 000

### How to work with this project
#### To start working with the contracts, please, follow theese steps for each contract:
1. Compile the contract using Remix with `enable optimization` flag and `compiler version` set to `0.8.0`.
2. Copy `.env.example` to `.env` and fill in the parameters.
2. Deploy the contract using deployment script:  
   ```truffle exec scripts/1_deploy_configurator.js --network NetworkName```  
   for example:  
   ```truffle exec scripts/1_deploy_configurator.js --network ropsten```
3. After deployment, run the following command with one or more contracts that you wish to verify:  
    ```truffle run verify SomeContractName@SomeContractAddress AnotherContractName@AnotherContractAddress --network NetworkName [--debug]```  
    for example:  
    ```truffle run verify  CandaoToken@0xd4eE90e82FE10d37d028084f262fbC092E2aEF81 --network ropsten```  
    You can find all information about deployed smart contracts in the file `report.NetworkName.log`.
#### How to get constructor arguements generated during deployment
1. Browse to your contract on Etherscan and click on the hash of the transaction with which it was created.
2. On the top right, where it reads "Tools & utilities", click on the arrow to see more options and select "Parity Trace".
3. For the action pertaining the contract creation, click on "Click to see more" below to see the input/output.
4. Copy the content of the "Init" field and paste somewhere in text file.
5. Copy "bytecode" string from ContractName.json generated by truffle and place it near the string from the previous step.
6. The difference between theese two strings is your encoded constructor arguements.
7. Pass them to `truffle-verify-plugin` as paramter: `--forceConstructorArgs string:ABIEncodedArguments`

#### How to use frontent example
1. `npx webpack build --config front/webpack.config.js`
2. Open `front/index.html` in browser.

### Wallets with ERC20 support
1. [MyEtherWallet](https://www.myetherwallet.com)
2. Parity
3. Mist/Ethereum wallet

EXODUS does not support ERC20, but provides the ability to export the private key to MyEtherWallet - http://support.exodus.io/article/128-how-do-i-receive-unsupported-erc20-tokens

## Main network configuration

### Contracts
* [Configurator](https://etherscan.io)
* [CandaoToken](https://etherscan.io)
* [Sale](https://etherscan.io)

### Sale stages
#### Stage 1
* Price                             : 21564 CDO per ETH
* Minimum purchase volume           : 0,03 ETH
* HardCap                           : 28 305 000 CDO
* Start date                        : 
* End date                          : 
* Bonus                             : 50%

#### Stage 2
* Price                             : 21564 CDO per ETH
* Minimum purchase volume           : 0,03 ETH
* HardCap                           : 28 305 000 CDO
* Start date                        :
* End date                          :
* Bonus                             : 20%

#### Stage 3
* Price                             : 21564 CDO per ETH
* Minimum purchase volume           : 0,03 ETH
* HardCap                           : 28 390 000 CDO
* Start date                        :
* End date                          :
* Bonus                             : 0%

## Test network configuration (Kovan)
You can find kovan test log [here](docs/kovan.log.md)

