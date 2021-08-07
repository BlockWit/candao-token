const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { balance, BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');

const Token = contract.fromArtifact('CandaoToken');

describe('Token', async function () {

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

  let token;

  beforeEach(async function() {
    token = await Token.new('Candao', 'CDO', initialAccounts, initialBalances, {from: owner});
  })

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = initialBalances.reduce((acc, val) => acc.add(val), ether('0'));
      expect(await token.totalSupply()).to.be.bignumber.equal(totalSupply);
    });
  });
  
  
});

