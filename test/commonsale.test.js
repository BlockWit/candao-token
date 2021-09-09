const { dateFromNow, getEvents, increaseDateTo } = require('./util');
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
    const tokensReserved = await sale.balancesCDO(buyer);
    expect(tokensReserved).to.be.bignumber.equal(tokensExpected);
  });

  it('should not return tokens above the hardcap', async function () {
    const { start, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('99');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const tokensReserved = await sale.balancesCDO(buyer);
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
    const tokensReserved = await sale.balancesCDO(buyer);
    expect(tokensReserved).to.be.bignumber.equal(tokensExpected);
  });

  it('should not allow token withdrawal before the end of the sale', async function () {
    const { start } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: sale is not over yet');
  });

  it('should allow to withdraw tokens after the end of the sale', async function () {
    const { start, bonus } = STAGES[1];
    const { end } = STAGES[2];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await increaseDateTo(end);
    const { receipt: { transactionHash } } = await sale.withdraw({ from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should charge referral bonuses in CDO correctly', async function () {
    const { start, bonus, refToken } = STAGES[1];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    await sale.sendTransaction({ value: ethSent1, from: referral });
    const referralTokensBefore = await sale.balancesCDO(referral);
    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    const tokensExpected = ethSent2.muln(PRICE * (100 + bonus) / 100);
    const tokensActual = await sale.balancesCDO(buyer);
    const referralTokensExpected = referralTokensBefore.add(tokensExpected.muln(refToken).divn(100));
    const referralTokensActual = await sale.balancesCDO(referral);
    expect(tokensActual).to.be.bignumber.equal(tokensExpected);
    expect(referralTokensActual).to.be.bignumber.equal(referralTokensExpected);
  });

  it('should allow the withdrawal of tokens obtained through the referral system', async function () {
    const { start, bonus, refToken } = STAGES[1];
    const { end } = STAGES[2];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');
    await sale.sendTransaction({ value: ethSent1, from: referral });
    const referralTokensBefore = await sale.balancesCDO(referral);
    await sale.sendTransaction({ value: ethSent2, from: buyer, data: referral });
    const tokensExpected = ethSent2.muln(PRICE * (100 + bonus) / 100);
    const referralTokensExpected = referralTokensBefore.add(tokensExpected.muln(refToken).divn(100));
    await increaseDateTo(end);
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
    const { end } = STAGES[2];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await increaseDateTo(end);
    await sale.withdraw({ from: buyer });
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: there are no assets that could be withdrawn from your account');
  });

  it('should remove stage by index correctly', async function () {
    await sale.removeStage(1, { from: owner });
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
