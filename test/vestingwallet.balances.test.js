const { getEvents } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const VestingWallet = contract.fromArtifact('VestingWallet');

const [owner, account1, account2] = accounts;
const GROUPS = [1, 2];
const SUPPLY = 100000;
const VESTING_SCHEDULES = [
  { index: 1, delay: time.duration.weeks(24), duration: time.duration.weeks(104), interval: time.duration.weeks(1), unlocked: 4 },
  { index: 2, delay: time.duration.weeks(24), duration: time.duration.weeks(104), interval: time.duration.weeks(1), unlocked: 6 }
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

  it('should not allow balance manipulations to non-owner accounts', async function () {
    await expectRevert(wallet.setBalance(0, account1, ether('1'), 0), 'Ownable: caller is not the owner');
    await expectRevert(wallet.addBalances(1, [account1], [ether('1')]), 'Ownable: caller is not the owner');
  });

  it('should allow to set balances', async function () {
    const { delay, duration } = VESTING_SCHEDULES[1];
    const amount = ether('1');
    await wallet.setBalance(0, account1, amount, 0, { from: owner });
    await wallet.activateWithdrawal({ from: owner });
    await time.increase(delay.add(duration));
    const { tx } = await wallet.withdraw({ from: account1 });
    const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    expect(tranche).to.be.bignumber.equal(amount);
  });

  it('should allow to add balances', async function () {
    const { delay, duration } = VESTING_SCHEDULES[1];
    const amount1 = ether('1');
    const amount2 = ether('2');
    await wallet.addBalances(1, [account1, account2], [amount1, amount2], { from: owner });
    await wallet.activateWithdrawal({ from: owner });
    await time.increase(delay.add(duration));
    const { tx: tx1 } = await wallet.withdraw({ from: account1 });
    const tranche1 = new BN((await getEvents(tx1, token, 'Transfer', web3))[0].args.value);
    const { tx: tx2 } = await wallet.withdraw({ from: account2 });
    const tranche2 = new BN((await getEvents(tx2, token, 'Transfer', web3))[0].args.value);
    expect(tranche1).to.be.bignumber.equal(amount1);
    expect(tranche2).to.be.bignumber.equal(amount2);
  });
});
