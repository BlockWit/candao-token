const { getEvents, dateFromNow, increaseDateTo, getTransactionCost } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const Sale = contract.fromArtifact('CommonSale');

const [owner, ethWallet, buyer, referral] = accounts;
const SUPPLY = 100000;
const PRICE = 21674;
const WITHDRAWAL_POLICIES = [
  { index: 1, duration: 20 * 30, interval: 30, bonus: 4 },
  { index: 2, duration: 20 * 30, interval: 30, bonus: 2 },
];

describe('CommonSale', async function () {
  let token;
  let sale;
  let STAGES;

  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000'), refETH: 5, refToken: 10 },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000'), refETH: 5, refToken: 10 },
      { start: await dateFromNow(11), end: await dateFromNow(13), bonus: 250, minInvestmentLimit: ether('0.03'), hardcap: ether('5000'), refETH: 5, refToken: 10 },
    ];
    sale = await Sale.new();
    token = await Token.new('Candao', 'CDO', [await sale.address], [ether(String(SUPPLY))]);
    await sale.setWallet(ethWallet);
    await sale.setPrice(ether(String(PRICE)));
    for (const { start, end, bonus, minInvestmentLimit, hardcap, refETH, refToken } of STAGES) {
      await sale.addStage(start, end, bonus, minInvestmentLimit, 0, 0, hardcap, 0, 0, refETH, refToken);
    }
    await sale.setToken(await token.address);
    for (const { index, duration, interval, bonus } of WITHDRAWAL_POLICIES) {
      await sale.setWithdrawalPolicy(index, duration, interval, bonus);
    }
    await sale.transferOwnership(owner);
  });

  it('should not allow premature token withdrawal', async function () {
    const { start } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: withdrawal is not yet active');
  });

  it('should allow to withdraw tokens after the end of the sale', async function () {
    const { start, bonus } = STAGES[1];
    const { duration } = WITHDRAWAL_POLICIES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await sale.activateWithdrawal({ from: owner });
    await increaseDateTo(await dateFromNow(duration));
    const { receipt: { transactionHash } } = await sale.withdraw({ from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should allow the withdrawal of tokens obtained through the referral system', async function () {
    const { start, bonus, refToken } = STAGES[1];
    const { duration } = WITHDRAWAL_POLICIES[0];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    await sale.sendTransaction({ value: ethSent1, from: referral });
    const referralTokensBefore = (await sale.balances(referral)).initialCDO;
    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    const tokensExpected = ethSent2.muln(PRICE * (100 + bonus) / 100);
    const referralTokensExpected = referralTokensBefore.add(tokensExpected.muln(refToken).divn(100));
    await sale.activateWithdrawal({ from: owner });
    await increaseDateTo(await dateFromNow(duration));
    const tx1 = await sale.withdraw({ from: buyer });
    const events1 = await getEvents(tx1.receipt.transactionHash, token, 'Transfer', web3);
    const tokensActual = new BN(events1[0].args.value);
    expect(tokensActual).to.be.bignumber.equal(tokensExpected);
    const tx2 = await sale.withdraw({ from: referral });
    const events2 = await getEvents(tx2.receipt.transactionHash, token, 'Transfer', web3);
    const referralTokensActual = new BN(events2[0].args.value);
    expect(referralTokensActual).to.be.bignumber.equal(referralTokensExpected);
  });

  it('should reject to withdraw tokens from empty account', async function () {
    const { start } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await sale.activateWithdrawal({ from: owner });
    await sale.withdraw({ from: buyer });
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: there are no assets that could be withdrawn from your account');
  });

  it('should allow to withdraw both tokens and ETH obtained through the referral system', async function () {
    const { start, bonus, refToken, refETH } = STAGES[1];
    const { duration } = WITHDRAWAL_POLICIES[0];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    const ethSent3 = ether('0.789');
    const referralBalanceBefore = new BN(await web3.eth.getBalance(referral));
    const { tx: tx1 } = await sale.sendTransaction({ value: ethSent1, from: referral });
    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    await sale.buyWithETHReferral(referral, { value: ethSent3, from: buyer });
    await sale.activateWithdrawal({ from: owner });
    await increaseDateTo(await dateFromNow(duration));
    const { tx: tx2, receipt: { transactionHash } } = await sale.withdraw({ from: referral });
    const tx1Cost = await getTransactionCost(tx1, web3);
    const tx2Cost = await getTransactionCost(tx2, web3);
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const referralTokensPurchased = ethSent1.muln(PRICE * (100 + bonus)).divn(100);
    const buyerTokensExpected = ethSent2.muln(PRICE * (100 + bonus)).divn(100);
    const referralTokensAccrued = buyerTokensExpected.muln(refToken).divn(100);
    const referralETHAccrued = ethSent3.muln(refETH).divn(100);
    const referralTokensReceived = new BN(events[0].args.value);
    const referralBalanceAfter = new BN(await web3.eth.getBalance(referral));
    expect(referralTokensReceived).to.be.bignumber.equal(referralTokensPurchased.add(referralTokensAccrued));
    expect(referralBalanceAfter).to.be.bignumber.equal(referralBalanceBefore.add(referralETHAccrued).sub(tx1Cost).sub(tx2Cost).sub(ethSent1));
  });

  it('should allow withdrawal of tokens in accordance with the withdrawal policy', async function () {
    const { start, bonus, refToken, refETH } = STAGES[1];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    const ethSent3 = ether('0.789');

    const referralETHBalanceBefore = new BN(await web3.eth.getBalance(referral));
    const { tx: tx1 } = await sale.sendTransaction({ value: ethSent1, from: referral });
    const tx1Cost = await getTransactionCost(tx1, web3);

    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    await sale.buyWithETHReferral(referral, { value: ethSent3, from: buyer });

    const referralTokensPurchased = ethSent1.muln(PRICE * (100 + bonus)).divn(100);
    const buyerTokensExpected = ethSent2.muln(PRICE * (100 + bonus)).divn(100);
    const referralTokensAccrued = buyerTokensExpected.muln(refToken).divn(100);
    const referralETHAccrued = ethSent3.muln(refETH).divn(100);
    const referralTokensTotal = referralTokensPurchased.add(referralTokensAccrued);

    const DURATION = 20 * 30;
    const INTERVAL = 30;
    const BONUS = 4;

    await sale.activateWithdrawal({ from: owner });
    await sale.setWithdrawalPolicy(1, DURATION, INTERVAL, BONUS, { from: owner });
    const { tx: tx2 } = await sale.withdraw({ from: referral });
    const tranche1 = new BN((await getEvents(tx2, token, 'Transfer', web3))[0].args.value);
    const tx2Cost = await getTransactionCost(tx2, web3);
    const referralETHBalanceAfter = new BN(await web3.eth.getBalance(referral));
    expect(referralETHBalanceAfter).to.be.bignumber.equal(referralETHBalanceBefore.sub(ethSent1).sub(tx1Cost).sub(tx2Cost).add(referralETHAccrued));
    expect(tranche1).to.be.bignumber.equal(referralTokensTotal.muln(4).divn(20));

    await increaseDateTo(await dateFromNow(INTERVAL));
    const { tx: tx3 } = await sale.withdraw({ from: referral });
    const tx3Cost = await getTransactionCost(tx3, web3);
    // no extra ETH withdrawed
    expect(new BN(await web3.eth.getBalance(referral))).to.be.bignumber.equal(referralETHBalanceAfter.sub(tx3Cost));
    const tranche2 = new BN((await getEvents(tx3, token, 'Transfer', web3))[0].args.value);
    expect(tranche2).to.be.bignumber.equal(referralTokensTotal.divn(20));
  });

  it('should allow to withdraw all available tokens at the end of vesting term', async function () {
    const { start, bonus } = STAGES[1];
    const { duration } = WITHDRAWAL_POLICIES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.456');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const buyerTokensExpected = ethSent.muln(PRICE * (100 + bonus)).divn(100);
    await sale.activateWithdrawal({ from: owner });
    await increaseDateTo(await dateFromNow(duration));
    const { tx } = await sale.withdraw({ from: buyer });
    const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    expect(tranche).to.be.bignumber.equal(buyerTokensExpected);
  });
});
