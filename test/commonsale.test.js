const { dateFromNow, getEvents, increaseDateTo } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const Sale = contract.fromArtifact('CommonSale');

const [owner, ethWallet, buyer] = accounts;
const SUPPLY = 100000;
const PRICE = 21674;

describe('CommonSale', async function () {
  
  let token;
  let sale;
  let STAGES;
  
  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000') },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000') },
      { start: await dateFromNow(11), end: await dateFromNow(13), bonus: 250, minInvestmentLimit: ether('0.03'), hardcap: ether('5000') }
    ];
    sale = await Sale.new() ;
    token = await Token.new("Candao", "CDO", [await sale.address], [ether(String(SUPPLY))]);
    await sale.setWallet(ethWallet);
    await sale.setPrice(ether(String(PRICE)));
    for ({start, end, bonus, minInvestmentLimit, hardcap} of STAGES) {
      await sale.addStage(start, end, bonus, minInvestmentLimit, 0, 0, hardcap);
    }
    await sale.setToken(await token.address);
    await sale.transferOwnership(owner);
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({value: ether('1'), from: buyer}), "StagedCrowdsale: No suitable stage found")
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({value: ether('1'), from: buyer}), "StagedCrowdsale: No suitable stage found")
  });

  it('should not accept ETH below min limit', async function () {
    await increaseDateTo(STAGES[0].start);
    await expectRevert(sale.sendTransaction({value: ether('0.029'), from: buyer}), "CommonSale: The amount of ETH you sent is too small.")
  });
  
  it('should accept ETH above min limit', async function () {
    const { start, bonus } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.1')
    const {receipt: {transactionHash}} = await sale.sendTransaction({value: ethSent, from: buyer});
    const events = await getEvents(transactionHash, token,'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should not return tokens above the hardcap', async function () {
    const { start, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('99')
    const {receipt: {transactionHash}} = await sale.sendTransaction({value: ethSent, from: buyer});
    const events = await getEvents(transactionHash, token,'Transfer', web3);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(hardcap);
  });

  it('should calculate change correctly', async function () {
    const { start, bonus, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethBalanceBefore = new BN(await web3.eth.getBalance(buyer));
    const ethSent = ether('100')
    const {receipt: {gasUsed, transactionHash}} = await sale.sendTransaction({value: ethSent, from: buyer});
    const {gasPrice} = await web3.eth.getTransaction(transactionHash);
    const ethBalanceAfter = new BN(await web3.eth.getBalance(buyer));
    const tokensPerEth = PRICE * (100 + bonus) / 100;
    const ethSpent = hardcap.divn(tokensPerEth);
    const ethTxFee = new BN(gasUsed * gasPrice)
    expect(ethBalanceBefore.sub(ethSpent).sub(ethTxFee)).to.be.bignumber.equal(ethBalanceAfter);
  });

  it('should not accept ETH between crowdsale stages', async function () {
    await increaseDateTo(STAGES[0].end);
    await expectRevert(sale.sendTransaction({value: ether('1'), from: buyer}), "StagedCrowdsale: No suitable stage found")
  });

  it('should accept ETH after the start of the next stage', async function () {
    const { start, bonus } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123')
    const {receipt: {transactionHash}} = await sale.sendTransaction({value: ethSent, from: buyer});
    const events = await getEvents(transactionHash, token,'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should remove stage by index correctly', async function () {
    await sale.removeStage(1, {from: owner});
    const stage0 = await sale.stages(0);
    const stage1 = await sale.stages(1);
    const stage2 = await sale.stages(2);
    expectStagesToBeEqual(stage0, STAGES[0]);
    expectStagesToBeEqual(stage1, STAGES[2]);
    expectStagesToBeEqual(stage2, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0')});
  });

  it('should remove all stages correctly', async function () {
    await sale.deleteStages({from: owner});
    const stage0 = await sale.stages(0);
    const stage1 = await sale.stages(1);
    const stage2 = await sale.stages(2);
    expectStagesToBeEqual(stage0, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0')});
    expectStagesToBeEqual(stage1, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0')});
    expectStagesToBeEqual(stage2, { start: 0, end: 0, bonus: 0, minInvestmentLimit: ether('0'), hardcap: ether('0')});
  });

});

function expectStagesToBeEqual(actual, expected) {
  expect(actual.start).to.be.bignumber.equal(new BN(expected.start));
  expect(actual.end).to.be.bignumber.equal(new BN(expected.end));
  expect(actual.bonus).to.be.bignumber.equal(new BN(expected.bonus));
  expect(actual.minInvestmentLimit).to.be.bignumber.equal(expected.minInvestmentLimit);
  expect(actual.hardcapInTokens).to.be.bignumber.equal(expected.hardcap);
}
