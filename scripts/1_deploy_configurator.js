const Configurator = artifacts.require('Configurator');
const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const addresses = await web3.eth.getAccounts();
  const [owner] = addresses;
  const configurator = await Configurator.new({ from: owner });
  log(`Configurator deployed at address: @address{${configurator.address}}`);
  log(`Sale address @address{${await configurator.sale()}}`);
  log(`Token address: @address{${await configurator.token()}}`);
}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};
