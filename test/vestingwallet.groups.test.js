const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const Wallet = contract.fromArtifact('VestingWallet');

const [owner, nonOwner] = accounts;
const GROUPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUPPLY = 100000;

describe('VestingWallet', async function () {
  let token;
  let wallet;

  beforeEach(async function () {
    wallet = await Wallet.new();
    token = await Token.new('Candao', 'CDO', [await wallet.address], [ether(String(SUPPLY))]);
    for (const group of GROUPS) {
      await wallet.addGroup(group);
    }
    await wallet.setToken(await token.address);
    await wallet.transferOwnership(owner);
  });

  it('should not allow group manipulations to non-owner accounts', async function () {
    await expectRevert(wallet.addGroup(11, { from: nonOwner }), 'Ownable: caller is not the owner');
    await expectRevert(wallet.updateGroup(1, 1, { from: nonOwner }), 'Ownable: caller is not the owner');
    await expectRevert(wallet.deleteGroup(1, { from: nonOwner }), 'Ownable: caller is not the owner');
  });

  it('should add group correctly', async function () {
    const VALUE = 123;
    const groupsCountBefore = await wallet.groupsCount();
    await wallet.addGroup(VALUE, { from: owner });
    const groupsCountAfter = await wallet.groupsCount();
    expect(groupsCountAfter).to.be.bignumber.equal(groupsCountBefore.addn(1));
    expect(await wallet.groups(groupsCountAfter.subn(1))).to.be.bignumber.equal(new BN(VALUE));
  });

  it('should update group correctly', async function () {
    const VALUE = 123;
    const group3Before = await wallet.groups(3);
    await wallet.updateGroup(3, VALUE, { from: owner });
    const group3After = await wallet.groups(3);
    expect(group3After).to.be.bignumber.not.equal(group3Before);
    expect(group3After).to.be.bignumber.equal(new BN(VALUE));
  });

  it('should remove group by index correctly', async function () {
    const groupsCountBefore = await wallet.groupsCount();
    const groupsBefore = await Promise.all([...Array(groupsCountBefore.toNumber()).keys()].map(async i => await wallet.groups(i)));
    await wallet.deleteGroup(1, { from: owner });
    const groupsCountAfter = await wallet.groupsCount();
    const groupsAfter = await Promise.all([...Array(groupsCountAfter.toNumber()).keys()].map(async i => await wallet.groups(i)));
    expect(groupsCountAfter).to.be.bignumber.equal(groupsCountBefore.subn(1));
    expect(groupsAfter[0]).to.be.bignumber.equal(groupsBefore[0]);
    expect(groupsAfter[1]).to.be.bignumber.equal(groupsBefore[2]);
  });
});
