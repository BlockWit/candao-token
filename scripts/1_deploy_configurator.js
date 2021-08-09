const Configurator = artifacts.require("Configurator");

async function deploy() {
  const addresses = await web3.eth.getAccounts();
  const [owner] = addresses;
  const configurator = await Configurator.new({ from: owner });
  console.log(`1. configurator deployed at address: ${configurator.address}`)
  console.log(`Token address: ${await configurator.token()}`)
  console.log(`Sale address: ${await configurator.sale()}`)
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
