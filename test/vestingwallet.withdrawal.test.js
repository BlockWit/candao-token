const { getEvents } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const VestingWallet = contract.fromArtifact('VestingWallet');

const [owner, account1] = accounts;
const GROUPS = [1, 2, 3];
const SUPPLY = 100000;
const VESTING_SCHEDULES = [
  { index: 1, delay: time.duration.weeks(12), duration: time.duration.weeks(104), interval: time.duration.weeks(1), unlocked: 4 },
  { index: 2, delay: time.duration.weeks(24), duration: time.duration.weeks(104), interval: time.duration.weeks(1), unlocked: 6 },
  { index: 3, delay: time.duration.weeks(0), duration: time.duration.weeks(104), interval: time.duration.weeks(1), unlocked: 10 }
];

describe('VestingWallet', async function () {
  let token;
  let wallet;

  beforeEach(async function () {
    wallet = await VestingWallet.new();
    token = await Token.new('Candao', 'CDO', [await wallet.address], [ether(String(SUPPLY))]);
    await wallet.setToken(await token.address);
    for (const group of GROUPS) {
      await wallet.addGroup(group);
    }
    for (const { index, delay, duration, interval, unlocked } of VESTING_SCHEDULES) {
      await wallet.setVestingSchedule(index, delay, duration, interval, unlocked);
    }
    await wallet.transferOwnership(owner);
  });

  it('should not allow premature token withdrawal', async function () {
    const { delay, duration } = VESTING_SCHEDULES[1];
    await time.increase(delay.add(duration));
    await expectRevert(wallet.withdraw({ from: account1 }), 'VestingWallet: withdrawal is not yet active');
  });

  it('should allow to withdraw tokens after the vesting starts', async function () {
    const { delay, unlocked } = VESTING_SCHEDULES[0];
    const amount = ether('0.123');
    await wallet.setBalance(0, account1, amount, 0, { from: owner });
    await wallet.activateWithdrawal({ from: owner });
    await time.increase(delay);
    const { receipt: { transactionHash } } = await wallet.withdraw({ from: account1 });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = amount.muln(unlocked).divn(100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should reject to withdraw tokens from an empty account', async function () {
    const { delay, duration } = VESTING_SCHEDULES[0];
    const amount = ether('0.456');
    await wallet.setBalance(0, account1, amount, 0, { from: owner });
    await wallet.activateWithdrawal({ from: owner });
    await time.increase(delay.add(duration));
    await wallet.withdraw({ from: account1 });
    await expectRevert(wallet.withdraw({ from: account1 }), 'VestingWallet: there are no assets that could be withdrawn from your account');
  });

  it('should allow withdrawal of tokens in accordance with the vesting schedule', async function () {
    const { delay, duration, interval, unlocked } = VESTING_SCHEDULES[0];
    const amount = ether('0.123');
    await wallet.setBalance(0, account1, amount, 0, { from: owner });
    await wallet.activateWithdrawal({ from: owner });

    // week 0
    await expectRevert(wallet.withdraw({ from: account1 }), 'VestingWallet: there are no assets that could be withdrawn from your account');

    // week 12
    await time.increase(delay);
    const { tx: tx1 } = await wallet.withdraw({ from: account1 });
    const tranche1 = new BN((await getEvents(tx1, token, 'Transfer', web3))[0].args.value);
    expect(tranche1).to.be.bignumber.equal(amount.mul(new BN(unlocked)).div(new BN(100)));

    // week 13
    await time.increase(interval);
    const { tx: tx2 } = await wallet.withdraw({ from: account1 });
    const tranche2 = new BN((await getEvents(tx2, token, 'Transfer', web3))[0].args.value);
    expect(tranche2).to.be.bignumber.equal(amount.mul(interval).div(duration));
    expect((await wallet.getAccountInfo(account1)).withdrawn).to.be.bignumber.equal(tranche1.add(tranche2));

    // week 14
    await time.increase(interval);
    const { tx: tx3 } = await wallet.withdraw({ from: account1 });
    const tranche3 = new BN((await getEvents(tx3, token, 'Transfer', web3))[0].args.value);
    expectToBeRoughlyEqual(tranche3, amount.mul(interval).div(duration), 1);
    expect((await wallet.getAccountInfo(account1)).withdrawn).to.be.bignumber.equal(tranche1.add(tranche2).add(tranche3));

    // week 116
    await time.increaseTo((await wallet.withdrawalStartDate()).add(duration).add(delay));
    await wallet.withdraw({ from: account1 });
    expect(await token.balanceOf(account1)).to.be.bignumber.equal(amount);
    const { initial, withdrawn, vested } = await wallet.getAccountInfo(account1);
    expect(initial).to.be.bignumber.equal(amount);
    expect(withdrawn).to.be.bignumber.equal(amount);
    expect(vested).to.be.bignumber.equal(new BN(0));
    await expectRevert(wallet.withdraw({ from: account1 }), 'VestingWallet: there are no assets that could be withdrawn from your account');
  });

  it('should behave correctly while collecting vested amounts from all groups', async function () {
    const [schedule1, schedule2, schedule3] = VESTING_SCHEDULES;

    const amount1 = ether('0.123');
    const amount2 = ether('0.456');
    const amount3 = ether('0.789');

    await wallet.addBalances(0, [account1], [amount1], { from: owner });
    await wallet.addBalances(1, [account1], [amount2], { from: owner });
    await wallet.addBalances(2, [account1], [amount3], { from: owner });
    await wallet.activateWithdrawal({ from: owner });

    // Week 0. Only the initially unlocked amount of group 3 should be available.
    {
      const { tx } = await wallet.withdraw({ from: account1 });
      const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      const expected = calculateInitiallyUnlockedAmount(amount3, schedule3);
      expect(tranche).to.be.bignumber.equal(expected);
    }

    // Week 11. Vested amount of group 3 for 11 weeks should be available.
    {
      await time.increase(time.duration.weeks(11));
      const { tx } = await wallet.withdraw({ from: account1 });
      const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      const expected = calculateVestedAmount(amount3, time.duration.weeks(11), schedule3);
      expectToBeRoughlyEqual(tranche, expected, 20);
    }

    // Week 12.
    // Group 1 - initial amount.
    // Group 3 - vested amount for 1 week.
    {
      await time.increase(time.duration.weeks(1));
      const expected1 = calculateInitiallyUnlockedAmount(amount1, schedule1);
      const expected2 = calculateVestedAmount(amount3, time.duration.weeks(1), schedule3);
      const { tx } = await wallet.withdraw({ from: account1 });
      const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      expectToBeRoughlyEqual(tranche, expected1.add(expected2), 1);
    }

    // Week 25.
    // Group 1 - vested amount for 13 weeks.
    // Group 2 - vested amount for 1 week + initial amount.
    // Group 3 - vested amount for 13 weeks.
    {
      await time.increase(time.duration.weeks(13));
      const expected1 = calculateVestedAmount(amount1, time.duration.weeks(13), schedule1);
      const expected2 = calculateVestedAmount(amount2, time.duration.weeks(1), schedule2).add(calculateInitiallyUnlockedAmount(amount2, schedule2));
      const expected3 = calculateVestedAmount(amount3, time.duration.weeks(13), schedule3);
      const { tx } = await wallet.withdraw({ from: account1 });
      const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      expectToBeRoughlyEqual(tranche, expected1.add(expected2).add(expected3), 30);
    }

    // Week 26.
    // Group 1 - vested amount for 1 week.
    // Group 2 - vested amount for 1 week.
    // Group 3 - vested amount for 1 week.
    {
      await time.increase(time.duration.weeks(1));
      const expected1 = calculateVestedAmount(amount1, time.duration.weeks(1), schedule1);
      const expected2 = calculateVestedAmount(amount2, time.duration.weeks(1), schedule2);
      const expected3 = calculateVestedAmount(amount3, time.duration.weeks(1), schedule3);
      const { tx } = await wallet.withdraw({ from: account1 });
      const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      expectToBeRoughlyEqual(tranche, expected1.add(expected2).add(expected3), 2);
    }

    // Week 128.
    // Group 1 - vested amount for 122 weeks.
    // Group 2 - vested amount for 122 weeks.
    // Group 3 - vested amount for 122 weeks.
    await time.increase(time.duration.weeks(128));
    await wallet.withdraw({ from: account1 });
    expect(await token.balanceOf(account1)).to.be.bignumber.equal(amount1.add(amount2).add(amount3));

    await expectRevert(wallet.withdraw({ from: account1 }), 'VestingWallet: there are no assets that could be withdrawn from your account');
  });
});

function calculateInitiallyUnlockedAmount (initial, schedule) {
  return initial.mul(new BN(schedule.unlocked)).div(new BN(100));
}

function calculateVestedAmount (initial, interval, schedule) {
  return initial.mul(interval).div(schedule.duration);
}

function expectToBeRoughlyEqual (value1, value2, margin) {
  if (!BN.isBN(margin)) margin = new BN(margin);
  return expect(value1).to.be.bignumber.lte(value2.add(margin)).and.to.be.bignumber.gte(value2.sub(margin));
}
