const { dateFromNow, getEvents, getTransactionCost, increaseDateTo } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const Sale = contract.fromArtifact('CommonSale');

const [owner, ethWallet, buyer, referral] = accounts;
const SUPPLY = 100000;
const PRICE = 21674;

describe('CommonSale', async function () {
  let token;
  let sale;
  let STAGES;

  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000'), refETH: 5, refToken: 10, schedule: 0 },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000'), refETH: 5, refToken: 10, schedule: 0 },
      { start: await dateFromNow(11), end: await dateFromNow(13), bonus: 250, minInvestmentLimit: ether('0.03'), hardcap: ether('5000'), refETH: 5, refToken: 10, schedule: 0 }
    ];
    sale = await Sale.new();
    token = await Token.new('Candao', 'CDO', [await sale.address], [ether(String(SUPPLY))]);
    await sale.setWallet(ethWallet);
    await sale.setPrice(ether(String(PRICE)));
    for (const { start, end, bonus, minInvestmentLimit, hardcap, refETH, refToken, schedule } of STAGES) {
      await sale.addStage(start, end, bonus, minInvestmentLimit, 0, 0, hardcap, 0, 0, refETH, refToken, schedule);
    }
    await sale.setToken(await token.address);
    await sale.transferOwnership(owner);
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'StagedCrowdsale: No suitable stage found');
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'StagedCrowdsale: No suitable stage found');
  });

  it('should not accept ETH below min limit', async function () {
    await increaseDateTo(STAGES[0].start);
    await expectRevert(sale.sendTransaction({ value: ether('0.029'), from: buyer }), 'CommonSale: The amount of ETH you sent is too small.');
  });

  it('should accept ETH above min limit', async function () {
    const { start, bonus } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.1');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReserved = (await sale.getAccountInfo(buyer)).initialCDO;
    expect(tokensReserved).to.be.bignumber.equal(tokensExpected);
  });

  it('should not return tokens above the hardcap', async function () {
    const { start, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('99');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const tokensReserved = (await sale.getAccountInfo(buyer)).initialCDO;
    expect(tokensReserved).to.be.bignumber.equal(hardcap);
  });

  it('should calculate change correctly', async function () {
    const { start, bonus, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethBalanceBefore = new BN(await web3.eth.getBalance(buyer));
    const ethSent = ether('100');
    const { receipt: { gasUsed, transactionHash } } = await sale.sendTransaction({ value: ethSent, from: buyer });
    const { gasPrice } = await web3.eth.getTransaction(transactionHash);
    const ethBalanceAfter = new BN(await web3.eth.getBalance(buyer));
    const tokensPerEth = PRICE * (100 + bonus) / 100;
    const ethSpent = hardcap.divn(tokensPerEth);
    const ethTxFee = new BN(gasUsed * gasPrice);
    expect(ethBalanceBefore.sub(ethSpent).sub(ethTxFee)).to.be.bignumber.equal(ethBalanceAfter);
  });

  it('should not accept ETH between crowdsale stages', async function () {
    await increaseDateTo(STAGES[0].end);
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'StagedCrowdsale: No suitable stage found');
  });

  it('should accept ETH after the start of the next stage', async function () {
    const { start, bonus } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReserved = (await sale.getAccountInfo(buyer)).initialCDO;
    expect(tokensReserved).to.be.bignumber.equal(tokensExpected);
  });

  it('should charge referral bonuses in CDO correctly', async function () {
    const { start, bonus, refToken } = STAGES[1];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    await sale.sendTransaction({ value: ethSent1, from: referral });
    const referralTokensBefore = new BN((await sale.getAccountInfo(referral)).initialCDO);
    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    const tokensExpected = ethSent2.muln(PRICE * (100 + bonus) / 100);
    const tokensActual = (await sale.getAccountInfo(buyer)).initialCDO;
    const referralTokensExpected = referralTokensBefore.add(tokensExpected.muln(refToken).divn(100));
    const referralTokensActual = (await sale.getAccountInfo(referral)).initialCDO;
    expect(tokensActual).to.be.bignumber.equal(tokensExpected);
    expect(referralTokensActual).to.be.bignumber.equal(referralTokensExpected);
  });

  it('should charge referral bonuses in ETH correctly', async function () {
    const { start, refETH } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.buyWithETHReferral(referral, { value: ethSent, from: buyer });
    const referralETHExpected = ethSent.muln(refETH).divn(100);
    const referralETHAccrued = (await sale.getAccountInfo(referral)).balanceETH;
    expect(referralETHAccrued).to.be.bignumber.equal(referralETHExpected);
    await sale.activateWithdrawal({ from: owner });
    const referralBalanceBefore = new BN(await web3.eth.getBalance(referral));
    const { tx, receipt: { gasUsed } } = await sale.withdraw({ from: referral });
    const { gasPrice } = await web3.eth.getTransaction(tx);
    const gasCost = (new BN(gasPrice)).mul(new BN(gasUsed));
    const referralBalanceAfter = await web3.eth.getBalance(referral);
    expect(referralBalanceAfter).to.be.bignumber.equal(referralBalanceBefore.add(referralETHExpected).sub(gasCost));
  });

  it('should remove stage by index correctly', async function () {
    await sale.deleteStage(1, { from: owner });
    const stage0 = await sale.stages(0);
    const stage1 = await sale.stages(1);
    const stage2 = await sale.stages(2);
    expectStagesToBeEqual(stage0, STAGES[0]);
    expectStagesToBeEqual(stage1, STAGES[2]);
    expectStagesToBeEqual(stage2, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0') });
  });

  it('should remove all stages correctly', async function () {
    await sale.deleteStages({ from: owner });
    const stage0 = await sale.stages(0);
    const stage1 = await sale.stages(1);
    const stage2 = await sale.stages(2);
    expectStagesToBeEqual(stage0, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0') });
    expectStagesToBeEqual(stage1, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0') });
    expectStagesToBeEqual(stage2, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0') });
  });
});

function expectStagesToBeEqual (actual, expected) {
  expect(actual.start).to.be.bignumber.equal(new BN(expected.start));
  expect(actual.end).to.be.bignumber.equal(new BN(expected.end));
  expect(actual.bonus).to.be.bignumber.equal(new BN(expected.bonus));
  expect(actual.minInvestmentLimit).to.be.bignumber.equal(expected.minInvestmentLimit);
  expect(actual.hardcapInTokens).to.be.bignumber.equal(expected.hardcap);
}
