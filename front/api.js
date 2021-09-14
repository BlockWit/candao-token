import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import { isAddress, parseEther } from 'ethers/lib/utils';

const SALE_ABI = [
  'function balances(address account) public view returns (uint256, uint256, uint256, uint8)',
  'function buyWithETHReferral(address referral) public payable returns (uint256)',
  'function withdraw() public'
];
const SALE_ADDRESS = '0x7d7235c1c2d8455EcF12ABdb167bc224BBC75416';

export default {
  // web3
  getEthereum: async function () {
    const ethereum = await detectEthereumProvider();
    if (!ethereum) throw new Error('No Ethereum provider found');
    return ethereum;
  },
  getWeb3Provider: async function () {
    const ethereum = await this.getEthereum();
    return new ethers.providers.Web3Provider(ethereum);
  },
  getAccounts: async function () {
    const ethereum = await this.getEthereum();
    return await ethereum.request({ method: 'eth_requestAccounts' });
  },
  handleAccountsChange: async function (cb) {
    const ethereum = await this.getEthereum();
    ethereum.on('accountsChanged', accounts => cb(accounts));
  },
  handleChainChange: async function (cb) {
    const ethereum = await this.getEthereum();
    ethereum.on('chainChanged', chainId => cb(chainId));
  },
  waitForTransaction: async function (txHash) {
    const web3Provider = await this.getWeb3Provider();
    return await web3Provider.waitForTransaction(txHash);
  },
  signMessage: async function (message) {
    await this.getAccounts();
    const web3provider = await this.getWeb3Provider();
    const signer = web3provider.getSigner();
    return await signer.signMessage(message);
  },
  // Sale contract interaction
  buyWithCDOReferral: async function (amount, referral) {
    const web3provider = await this.getWeb3Provider();
    const signer = web3provider.getSigner();
    const params = { to: SALE_ADDRESS, value: parseEther(amount) };
    if (referral) {
      if (!isAddress(referral)) throw new Error('Incorrect referral address');
      params.data = referral;
    }
    return await signer.sendTransaction(params);
  },
  buyWithETHReferral: async function (amount, referral) {
    if (!isAddress(referral)) throw new Error('Incorrect referral address');
    const web3provider = await this.getWeb3Provider();
    const contract = new ethers.Contract(SALE_ADDRESS, SALE_ABI, web3provider);
    const signer = web3provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    return await contractWithSigner.buyWithETHReferral(referral, { value: parseEther(amount) });
  },
  requestAccountInfo: async function (accountAddress) {
    const web3provider = await this.getWeb3Provider();
    const contract = new ethers.Contract(SALE_ADDRESS, SALE_ABI, web3provider);
    const [ initialCDO, withdrawedCDO, balanceETH, withdrawalPolicy ] = await contract.balances(accountAddress);
    return { initialCDO: initialCDO.toString(), withdrawedCDO: withdrawedCDO.toString(), balanceETH: balanceETH.toString(), withdrawalPolicy: withdrawalPolicy.toString() };
  },
  withdraw: async function () {
    const web3provider = await this.getWeb3Provider();
    const contract = new ethers.Contract(SALE_ADDRESS, SALE_ABI, web3provider);
    const signer = web3provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    return await contractWithSigner.withdraw();
  }
};
