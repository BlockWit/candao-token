const { toBN, toWei } = web3.utils;
const { logger } = require('./util');
const Configurator = artifacts.require("Configurator");
const Token = artifacts.require("CandaoToken");
const Sale = artifacts.require("CommonSale");
const Wallet = artifacts.require("FreezeTokenWallet");



async function deploy() {
  const CONFIGURATOR_ADDRESS = '';
  const configurator = await Configurator.at(CONFIGURATOR_ADDRESS);
  const SALE_ADDRESS = await configurator.sale();
  const sale = await Sale.at(SALE_ADDRESS);
  const TOKEN_ADDRESS = await configurator.token();
  const token = await Token.at(TOKEN_ADDRESS);
  const WALLET_ADDRESSES = [];
  for (let i = 0; i < 5; i++) {
    WALLET_ADDRESSES.push(await configurator.wallets(i));
  }
  const wallets = await Promise.all(WALLET_ADDRESSES.map(async address => {
    return await Wallet.at(address);
  }));
  
  const { log, logRevert } = logger(await web3.eth.net.getNetworkType());
  const [deployer, owner, seed1, , , , , , , , seed2, , , , , buyer, anotherAccount] = await web3.eth.getAccounts();
  
  await logRevert(async () => {
    log(`CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.`)
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.04', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })

  await logRevert(async () => {
    log(`CommonSale. Attempting to call "updateStage" method from a non-owner account. Should revert.`)
    const startTime = Math.floor(Date.now() / 1000).toString();
    const tx = await sale.updateStage(0, startTime, '1629673200', '500', '30000000000000000', '18480000000000000000000000', { from: buyer })
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })
  
  await (async () => {
    log(`CommonSale. Change the beginning time of the first stage.`)
    const startTime = Math.floor(Date.now() / 1000).toString();
    const tx = await sale.updateStage(0, startTime, '1629673200', '500', '30000000000000000', '18480000000000000000000000', { from: owner })
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attempting to send less than the allowed amount of Eth. Should revert.`)
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.02', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })

  await (async () => {
    log(`CommonSale. Send 0.03 Eth from buyer's account.`)
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.03', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`Token. Attempting to transfer token before it's unpaused. Should revert.`)
    const balance = await token.balanceOf(buyer);
    const tx = await token.transfer(anotherAccount, balance, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })

  await logRevert(async () => {
    log(`Token. Attempting to call "unpause" method from a non-owner account. Should revert.`)
    const tx = await token.unpause({ from: anotherAccount })
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })

  await (async () => {
    log(`Token. Unpause.`)
    const tx = await token.unpause({ from: owner })
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`Token. Transfer after it's been unpaused from seed2's account.`)
    const balance = await token.balanceOf(seed2);
    const tx = await token.transfer(anotherAccount, balance, { from: seed2 });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`Token. Transfer after it's been unpaused from buyer's account.`)
    const balance = await token.balanceOf(buyer);
    const tx = await token.transfer(anotherAccount, balance, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`FreezeTokenWallet. Attempting to withdraw tokens ahead of schedule. Should revert.`)
    const tx = await wallets[0].retrieveWalletTokens(seed2, { from: seed2 });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason "${reason}". @tx{${txHash}}`);
  })
  

}

module.exports = async function main(callback) {
  try {
    await deploy();
    console.log('success');
    callback(0);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(1);
  }
}
