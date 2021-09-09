const { accounts, contract } = require('@openzeppelin/test-environment');
const { ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Contract = contract.fromArtifact('InputAddressContractMock');
const [first, second] = accounts;

describe('InputAddress', function () {
  it('should extract address from input data correctly', async function () {
    const contract = await Contract.new({ from: first });
    await contract.sendTransaction({ value: ether('1'), from: first, data: second });
    const expectedAddr = second;
    const actualAddr = await contract.data();
    expect(actualAddr.toLowerCase()).to.be.equal(expectedAddr.toLowerCase());
  });
});
