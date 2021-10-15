const { getEvents, dateFromNow, increaseDateTo, getTransactionCost } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time: { duration, increase, increaseTo } } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const Sale = contract.fromArtifact('CommonSale');

const [owner, ethWallet, account1, account2] = accounts;
const SUPPLY = 100000;
const PRICE = 21674;
const VESTING_SCHEDULES = [
  { index: 1, timeout: duration.weeks(24), duration: duration.weeks(104), interval: duration.weeks(1), unlocked: 4 },
  { index: 2, timeout: duration.weeks(24), duration: duration.weeks(104), interval: duration.weeks(1), unlocked: 6 }
];

describe('CommonSale', async function () {
  let token;
  let sale;
  let STAGES;

  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000'), refETH: 5, refToken: 10, schedule: 0 },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000'), refETH: 5, refToken: 10, schedule: 1 },
      { start: await dateFromNow(11), end: await dateFromNow(13), bonus: 250, minInvestmentLimit: ether('0.03'), hardcap: ether('5000'), refETH: 5, refToken: 10, schedule: 2 }
    ];
    sale = await Sale.new();
    token = await Token.new('Candao', 'CDO', [await sale.address], [ether(String(SUPPLY))]);
    await sale.setWallet(ethWallet);
    await sale.setPrice(ether(String(PRICE)));
    for (const { start, end, bonus, minInvestmentLimit, hardcap, refETH, refToken, schedule } of STAGES) {
      await sale.addStage(start, end, bonus, minInvestmentLimit, 0, 0, hardcap, 0, 0, refETH, refToken, schedule);
    }
    await sale.setToken(await token.address);
    for (const { index, timeout, duration, interval, unlocked } of VESTING_SCHEDULES) {
      await sale.setVestingSchedule(index, timeout, duration, interval, unlocked);
    }
    await sale.transferOwnership(owner);
  });

  it('should allow to set balances', async function () {
    const { duration } = VESTING_SCHEDULES[1];
    const amount = ether('1');
    await sale.setBalance(0, account1, amount, 0, 0, { from: owner });
    await sale.activateWithdrawal({ from: owner });
    const { tx } = await sale.withdraw({ from: account1 });
    const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    expect(tranche).to.be.bignumber.equal(amount);
  });

  it('should allow to add balances', async function () {
    const { timeout, duration } = VESTING_SCHEDULES[1];
    const amount1 = ether('1');
    const amount2 = ether('2');
    await sale.addBalances(1, [account1, account2], [amount1, amount2], { from: owner });
    await sale.activateWithdrawal({ from: owner });
    await increaseTo((await sale.withdrawalStartDate()).add(timeout).add(duration));
    const { tx: tx1 } = await sale.withdraw({ from: account1 });
    const tranche1 = new BN((await getEvents(tx1, token, 'Transfer', web3))[0].args.value);
    const { tx: tx2 } = await sale.withdraw({ from: account2 });
    const tranche2 = new BN((await getEvents(tx2, token, 'Transfer', web3))[0].args.value);
    expect(tranche1).to.be.bignumber.equal(amount1);
    expect(tranche2).to.be.bignumber.equal(amount2);
  });
});
