const { toBN, toWei } = web3.utils;
const { logger } = require('./util');
const { ether } = require('@openzeppelin/test-helpers');
const Configurator = artifacts.require('Configurator');
const Token = artifacts.require('CandaoToken');
const VestingWallet = artifacts.require('VestingWallet');

async function deploy () {
  const args = process.argv.slice(2);
  const CONFIGURATOR_ADDRESS = args[args.findIndex(argName => argName === '--configuratorAddress') + 1];
  console.log(`Using Configurator address: ${CONFIGURATOR_ADDRESS}`);
  const configurator = await Configurator.at(CONFIGURATOR_ADDRESS);
  const WALLET_ADDRESS = await configurator.wallet();
  const wallet = await VestingWallet.at(WALLET_ADDRESS);
  const TOKEN_ADDRESS = await configurator.token();

  const { log, logRevert } = logger(await web3.eth.net.getNetworkType());
  const [owner, user] = await web3.eth.getAccounts();

  await logRevert(async () => {
    log(`VestingWallet. Attemping to set balance from non-owner account. Should revert`);
    const amount = ether('1');
    const tx = await wallet.setBalance(user, amount, 0, 0, 2, { from: user });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`VestingWallet. Set balance. Should rewrite target account's balance.`);
    const amount = ether('1');
    const tx = await wallet.setBalance(7, user, amount, 0, { from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attemping to add balances from non-owner account. Should revert`);
    const amount = ether('1');
    const tx = await wallet.addBalances(7, [user], [amount], { from: user });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. add balances. Should increase target accounts by specified amounts.`);
    const amount = ether('1');
    const tx = await wallet.addBalances(7, [user, '0xf934346869bF048fC322354281cAcC1aC361D95c'], [amount, ether('1000')], { from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attempting to enable withdrawal from non-owner account. Should revert.`);
    const tx = await wallet.activateWithdrawal({ from: user });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await logRevert(async () => {
    log(`CommonSale. Attempting to withdraw before withdrawal is enabled. Should revert`);
    const tx = await wallet.withdraw({ from: user });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. Enable withdrawal.`);
    const tx = await wallet.activateWithdrawal({ from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`CommonSale. Withdraw from user's account.`);
    const tx = await wallet.withdraw({ from: user });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();
}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};
