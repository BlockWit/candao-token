const fs = require('fs');

function logger(network) {
  let prefix;
  switch (network) {
    case 'ropsten': prefix = 'https://ropsten.etherscan.io'; break;
    default: prefix = 'https://etherscan.io';
  }
  return (text) => {
    const result = text
      .replace(/@address{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@token{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@tx{(.+?)}/g, `${prefix}/tx/$1`);
    console.log(result);
    fs.appendFileSync(`report.${network}.log`, `${result}\n`);
  }
}

module.exports = { logger };
