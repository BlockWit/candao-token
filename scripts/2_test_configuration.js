const { toBN, toWei } = web3.utils;
const { logger } = require('./util');
const { ether } = require('@openzeppelin/test-helpers');
const Configurator = artifacts.require('Configurator');
const Token = artifacts.require('CandaoToken');
const Sale = artifacts.require('CommonSale');

async function deploy () {
  const args = process.argv.slice(2);
  const CONFIGURATOR_ADDRESS = args[args.findIndex(argName => argName === '--configuratorAddress') + 1];
  console.log(`Configurator address: ${CONFIGURATOR_ADDRESS}`);
  const configurator = await Configurator.at(CONFIGURATOR_ADDRESS);
  const SALE_ADDRESS = await configurator.sale();
  const sale = await Sale.at(SALE_ADDRESS);
  const TOKEN_ADDRESS = await configurator.token();
  const token = await Token.at(TOKEN_ADDRESS);

  const { log, logRevert } = logger(await web3.eth.net.getNetworkType());
  const [deployer, owner, buyer, referral, anotherAccount] = await web3.eth.getAccounts();

  await logRevert(async () => {
    log(`CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.`);
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.04', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await logRevert(async () => {
    log(`CommonSale. Attempting to call 'updateStage' method from a non-owner account. Should revert.`);
    const startTime = Math.floor(Date.now() / 1000).toString();
    const tx = await sale.updateStage(0, startTime, '1629673200', '500', '30000000000000000', '18480000000000000000000000', 5, 10, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. Change the beginning time of the first stage.`);
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 24 * 3600;
    const tx = await sale.updateStage(0, startTime.toString(), endTime.toString(), '500', '30000000000000000', '18480000000000000000000000', 5, 10, { from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attempting to send less than the allowed amount of Eth. Should revert.`);
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.02', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. Send 0.03 Eth from buyer's account.`);
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.03', 'ether'), gas: '200000' });
    log(`Result: successful tx: @tx{${tx.transactionHash}}`);
  })();

  await (async () => {
    log(`CommonSale. Send 0.09 Eth from buyer's account. Specify CDO referral.`);
    const tx = await web3.eth.sendTransaction({ from: buyer, to: SALE_ADDRESS, value: toWei('0.09', 'ether'), data: referral, gas: '200000' });
    log(`Result: successful tx: @tx{${tx.transactionHash}}`);
  })();

  await (async () => {
    log(`CommonSale. Send 0.09 Eth from buyer's account. Specify ETH referral.`);
    const tx = await sale.buyWithETHReferral(referral, { from: buyer, value: toWei('0.09', 'ether') });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attempting to enable withdrawal from non-owner account. Should revert.`);
    const tx = await sale.activateWithdrawal({ from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await logRevert(async () => {
    log(`CommonSale. Attempting to withdraw before withdrawal is enabled. Should revert`);
    const tx = await sale.withdraw({ from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. Enable withdrawal.`);
    const tx = await sale.activateWithdrawal({ from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`CommonSale. Withdraw from buyer's account.`);
    const tx = await sale.withdraw({ from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`CommonSale. Withdraw from referral's account.`);
    const tx = await sale.withdraw({ from: referral });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await (async () => {
    log(`Token. Transfer from buyer's account.`);
    const balance = await token.balanceOf(buyer);
    const tx = await token.transfer(anotherAccount, balance, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attemping to set balance from non-owner account. Should revert`);
    const amount = ether('1');
    const tx = await sale.setBalance(anotherAccount, amount, 0, 0, 2, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. Set balance. Should rewrite target account's balance.`);
    const amount = ether('1');
    const tx = await sale.setBalance(anotherAccount, amount, 0, 0, 2, { from: owner });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  })();

  await logRevert(async () => {
    log(`CommonSale. Attemping to add balances from non-owner account. Should revert`);
    const amount1 = ether('1');
    const amount2 = ether('2');
    const tx = await sale.addBalances([buyer, anotherAccount], [amount1, amount2], 2, { from: buyer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }, (txHash, reason) => {
    log(`Result: Revert with reason '${reason}'. @tx{${txHash}}`);
  });

  await (async () => {
    log(`CommonSale. add balances. Should increase target accounts by specified amounts.`);
    const amount1 = ether('1');
    const amount2 = ether('2');
    const tx = await sale.addBalances([buyer, anotherAccount], [amount1, amount2], 2, { from: owner });
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
