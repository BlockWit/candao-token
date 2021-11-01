const { accounts, contract } = require('@openzeppelin/test-environment');
const { constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const { shouldBehaveLikeERC20 } = require('./behaviors/ERC20.behavior');
const { shouldBehaveLikeERC20Burnable } = require('./behaviors/ERC20Burnable.behavior');
const { shouldBehaveLikeRecoverableFunds } = require('./behaviors/RecoverableFunds.behaviour');
const { shouldBehaveLikeWithCallback } = require('./behaviors/WithCallback.behaviour');

const Token = contract.fromArtifact('CandaoToken');

const [account1, account2, account3, account4, account5, account6, account7, account8, owner ] = accounts;
const SUPPLY1 = ether('400000000');
const SUPPLY2 = ether('250000000');
const SUPPLY3 = ether('210000000');
const SUPPLY4 = ether('200000000');
const SUPPLY5 = ether('150000000');
const SUPPLY6 = ether('150000000');
const SUPPLY7 = ether('100000000');
const SUPPLY8 = ether('40000000');
const initialAccounts = [account1, account2, account3, account4, account5, account6, account7, account8];
const initialBalances = [SUPPLY1, SUPPLY2, SUPPLY3, SUPPLY4, SUPPLY5, SUPPLY6, SUPPLY7, SUPPLY8];

describe('ERC20', function () {

  beforeEach(async function() {
    this.token = await Token.new('Candao', 'CDO', [account1], [SUPPLY1], {from: owner});
  })

  shouldBehaveLikeERC20("ERC20", SUPPLY1, account1, account2, account3);
  shouldBehaveLikeERC20Burnable(account1, SUPPLY1, [account2]);
  shouldBehaveLikeWithCallback(owner, account1, account2, account3);

});

describe('RecoverableFunds', function () {

  beforeEach(async function() {
    this.testedContract = await Token.new('Candao', 'CDO', [account1], [SUPPLY1], {from: owner});
  })

  shouldBehaveLikeRecoverableFunds(owner, account2, account3);
});

describe('CandaoToken', async function () {

  let token;

  beforeEach(async function() {
    token = await Token.new('Candao', 'CDO', initialAccounts, initialBalances, {from: owner});
  })

  describe('total supply', function() {
    it('returns the total amount of tokens', async function () {
      const totalSupply = initialBalances.reduce((acc, val) => acc.add(val), ether('0'));
      expect(await token.totalSupply()).to.be.bignumber.equal(totalSupply);
    });
  });

  describe('transfer', function() {
    it('works correctly', async function () {
      const balance1Before = await token.balanceOf(account1);
      const balance2Before = await token.balanceOf(account2);
      const amountToTransfer = ether('123321');
      await token.transfer(account2, amountToTransfer, {from: account1});
      const balance1After = await token.balanceOf(account1);
      const balance2After = await token.balanceOf(account2);
      expect(balance1After).to.be.bignumber.equal(balance1Before.sub(amountToTransfer));
      expect(balance2After).to.be.bignumber.equal(balance2Before.add(amountToTransfer));
    });
  });

  describe('pausable', function() {
    describe('when not paused', function() {
      it('allows to transfer', async function () {
        const value = ether('123');
        expectEvent(await token.transfer(account2, value, {from: account1}), 'Transfer', {
          from: account1,
          to: account2,
          value,
        });
      });
      it('allows to transfer from another account', async function () {
        const value = ether('123');
        await token.increaseAllowance(account2, value, {from: account1});
        expectEvent(await token.transferFrom(account1, account3, value, {from: account2}), 'Transfer', {
          from: account1,
          to: account3,
          value,
        });
      });
      it('allows to burn', async function() {
        const value = ether('123');
        expectEvent(await token.burn(value, {from: account1}), 'Transfer', {
          from: account1,
          to: ZERO_ADDRESS,
          value,
        });
      });
      it('allows to burn from another account', async function() {
        const value = ether('123');
        await token.increaseAllowance(account2, value, {from: account1});
        expectEvent(await token.burnFrom(account1, value, {from: account2}), 'Transfer', {
          from: account1,
          to: ZERO_ADDRESS,
          value,
        });
      });
    })
    describe('when paused', function() {
      beforeEach(async function() {
        await token.pause({from: owner});
      })
      describe('for non-whitelisted accounts', function() {
        it('prohibits transferring', async function () {
          const value = ether('123');
          await expectRevert(token.transfer(account2, value, { from: account1 }), 'Pausable: paused');
        });
        it('prohibits transferring from another account', async function () {
          const value = ether('123');
          await token.increaseAllowance(account2, value, {from: account1});
          await expectRevert(token.transferFrom(account1, account3, value, {from: account2}), 'Pausable: paused');
        });
        it('prohibits burning', async function() {
          const value = ether('123');
          await expectRevert(token.burn(value, {from: account1}), 'Pausable: paused');
        });
        it('prohibits burning from another account', async function() {
          const value = ether('123');
          await token.increaseAllowance(account2, value, {from: account1});
          await expectRevert(token.burnFrom(account1, value, {from: account2}), 'Pausable: paused');
        });
      });
      describe('for whitelisted accounts', function() {
        beforeEach(async function() {
          token.addToWhitelist([account1], {from: owner});
        });
        it('allows to transfer', async function () {
          const value = ether('123');
          expectEvent(await token.transfer(account2, value, {from: account1}), 'Transfer', {
            from: account1,
            to: account2,
            value,
          });
        });
        it('allows to transfer from another account', async function () {
          const value = ether('123');
          await token.increaseAllowance(account2, value, {from: account1});
          expectEvent(await token.transferFrom(account1, account3, value, {from: account2}), 'Transfer', {
            from: account1,
            to: account3,
            value,
          });
        });
        it('allows to burn', async function() {
          const value = ether('123');
          expectEvent(await token.burn(value, {from: account1}), 'Transfer', {
            from: account1,
            to: ZERO_ADDRESS,
            value,
          });
        });
        it('allows to burn from another account', async function() {
          const value = ether('123');
          await token.increaseAllowance(account2, value, {from: account1});
          expectEvent(await token.burnFrom(account1, value, {from: account2}), 'Transfer', {
            from: account1,
            to: ZERO_ADDRESS,
            value,
          });
        });
      });
    });
  });


});

