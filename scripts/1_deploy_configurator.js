const Configurator = artifacts.require("Configurator");
const { logger } = require('./util');

async function deploy() {
  const log  = logger(await web3.eth.net.getNetworkType());
  const addresses = await web3.eth.getAccounts();
  const [owner] = addresses;
  const configurator = await Configurator.new({ from: owner });
  log(`1. Configurator deployed at address: @address{${configurator.address}}`);
  await configurator.step1({ from: owner });
  log(`2. Step1 complete. CommonSale deployed at address @address{${await configurator.saleAddress()}}`);
  await configurator.step2({ from: owner });
  log(`3. Step2 complete. Wallets:`)
  for (let i = 0; i < 5; i++) {
    log(`@address{${await configurator.walletAddresses(i)}}`)
  }
  await configurator.step3({ from: owner });
  log(`4. step3 complete. Token address: @address{${await configurator.tokenAddress()}}`)
}

module.exports = async function main(callback) {
  try {
    await deploy();
    console.log('success');
    callback(0);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(1);
  }
}
