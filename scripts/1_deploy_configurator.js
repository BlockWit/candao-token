const Configurator = artifacts.require("Configurator");
const { logger } = require('./util');

async function deploy() {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const addresses = await web3.eth.getAccounts();
  const [owner] = addresses;
  const configurator = await Configurator.new({ from: owner });
  log(`Configurator deployed at address: @address{${configurator.address}}`);
  log(`Sale address @address{${await configurator.sale()}}`);
  log(`Token address: @address{${await configurator.token()}}`)
  log(`Wallets:`)
  for (let i = 0; i < 5; i++) {
    log(`@address{${await configurator.wallets(i)}}`)
  }
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
