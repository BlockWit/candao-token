const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const FreezeTokenWallet = contract.fromArtifact('FreezeTokenWallet');

const [owner, account1, account2] = accounts;
const SUPPLY1 = ether('10000000');
const SUPPLY2 = ether('10000000');

const initialBalances = [SUPPLY1, SUPPLY2];

const START_DATE = 1629061200;
const DURATION = 90;
const INTERVAL = 90;

describe('FreezeTokenWallet', async function () {

  beforeEach(async function () {
    this.wallet = await FreezeTokenWallet.new({from: owner});
    await this.wallet.setStartDate(START_DATE, {from: owner});
    await this.wallet.setDuration(DURATION, {from: owner});
    await this.wallet.setInterval(INTERVAL, {from: owner});
    this.token = await Token.new("Candao", "CDO", [account1, await this.wallet.address], initialBalances, {from: owner});
    await this.wallet.setToken(await this.token.address, {from: owner});
    await this.wallet.start({from: owner});
    await this.wallet.transferOwnership(account2, {from: owner});
  });

  describe('Wallet', function() {
    it('should have owner', async function () {
      expect(await this.wallet.owner()).to.equal(account2);
    });

    it('should not allow premature withdrawal of tokens', async function () {
      await expectRevert(this.wallet.retrieveWalletTokens(account1, {from: account2}), "Freezing period has not started yet.");
    });

    it('should not allow to withdraw TesSet tokens with retriveTokens method', async function () {
      await expectRevert(this.wallet.retrieveTokens(account2, await this.token.address, {from: account2}), "You should only use this method to withdraw extraneous tokens.");
    });

    it('should allow withdrawal of tokens in accordance with the withdrawal policy', async function () {
      const delay = DURATION * 24 * 3600;
      await time.increaseTo(START_DATE + delay);
      const walletBalanceBefore = await this.token.balanceOf(await this.wallet.address);
      const accountBalanceBefore = await this.token.balanceOf(account2);
      await this.wallet.retrieveWalletTokens(account2, {from: account2});
      const walletBalanceAfter = await this.token.balanceOf(await this.wallet.address);
      const accountBalanceAfter = await this.token.balanceOf(account2);
      expect(walletBalanceBefore).to.be.bignumber.equal(SUPPLY2);
      expect(accountBalanceBefore).to.be.bignumber.equal(ether('0'));
      expect(walletBalanceAfter).to.be.bignumber.equal(ether('0'));
      expect(accountBalanceAfter).to.be.bignumber.equal(SUPPLY2);
    });
    
  })

});

