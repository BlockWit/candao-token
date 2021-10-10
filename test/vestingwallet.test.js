const { getEvents } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');
const FreezeTokenWallet = contract.fromArtifact('FreezeTokenWallet');

const [owner, account1, walletOwner] = accounts;
const SUPPLY1 = ether('10000000');
const WALLET_SUPPLY = ether('10000000');

const initialBalances = [SUPPLY1, WALLET_SUPPLY];

describe('VestingWallet', async function () {

  const START_DATE = 1629061200;
  const INTERVAL = 90;

  beforeEach(async function () {
    this.wallet = await FreezeTokenWallet.new({from: owner});
    await this.wallet.setStartDate(START_DATE, {from: owner});
    await this.wallet.setInterval(INTERVAL, {from: owner});
    this.token = await Token.new("Candao", "CDO", [account1, await this.wallet.address], initialBalances, {from: owner});
    await this.wallet.setToken(await this.token.address, {from: owner});
  });

  describe('with a regular token release schedule', function() {

    const DURATION = 360;

    beforeEach(async function () {
      await this.wallet.setDuration(DURATION, {from: owner});
      await this.wallet.start({from: owner});
      await this.wallet.transferOwnership(walletOwner, {from: owner});
    });

    it('should have owner', async function () {
      expect(await this.wallet.owner()).to.equal(walletOwner);
    });

    it('should not allow withdrawing ahead of schedule', async function () {
      await expectRevert(this.wallet.retrieveWalletTokens(account1, {from: walletOwner}), "Freezing period has not started yet.");
    });

    it('should not allow to withdraw CDO tokens using retriveTokens method', async function () {
      await expectRevert(this.wallet.retrieveTokens(walletOwner, await this.token.address, {from: walletOwner}), "You should only use this method to withdraw extraneous tokens.");
    });

    it('should allow withdrawal of tokens in accordance with the withdrawal policy', async function () {
      const withdrawals = DURATION / INTERVAL;
      const tranche = WALLET_SUPPLY.divn(withdrawals);
      function* intervals(){
        let index = 0;
        while(index < withdrawals) yield {
          idx: index++,
          delay: index * INTERVAL * 24 * 3600,
          remainder: WALLET_SUPPLY.sub(tranche.muln(index))
        };
      }
      for (const {delay, remainder} of intervals()) {
        const currentDate = await time.latest();
        if (currentDate < START_DATE + delay) await time.increaseTo(START_DATE + delay);
        const {receipt: {transactionHash}} = await this.wallet.retrieveWalletTokens(walletOwner, {from: walletOwner});
        const events = await getEvents(transactionHash, this.token,'Transfer', web3);
        const tokensToSend = new BN(events[0].args.value);
        const tokensRemained = await this.token.balanceOf(await this.wallet.address);
        expect(tokensToSend).to.be.bignumber.equal(tranche);
        expect(tokensRemained).to.be.bignumber.equal(remainder);
      }
    });

  })

  describe('with duration equal to interval', function() {

    const DURATION = 90;

    beforeEach(async function () {
      await this.wallet.setDuration(DURATION, {from: owner});
      await this.wallet.start({from: owner});
      await this.wallet.transferOwnership(walletOwner, {from: owner});
    });

    it('should allow withdrawal of tokens', async function () {
      const delay = DURATION * 24 * 3600;
      const currentDate = await time.latest();
      if (currentDate < START_DATE + delay) await time.increaseTo(START_DATE + delay);
      const {receipt: {transactionHash}} = await this.wallet.retrieveWalletTokens(walletOwner, {from: walletOwner});
      const events = await getEvents(transactionHash, this.token,'Transfer', web3);
      const tokensToSend = new BN(events[0].args.value);
      const tokensRemained = await this.token.balanceOf(await this.wallet.address);
      expect(tokensToSend).to.be.bignumber.equal(WALLET_SUPPLY);
      expect(tokensRemained).to.be.bignumber.equal(ether('0'));
    });

  })

});

