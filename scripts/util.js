const fs = require('fs');

function logger(network) {
  let prefix;
  
  switch (network) {
    case 'kovan': prefix = 'https://kovan.etherscan.io'; break;
    case 'ropsten': prefix = 'https://ropsten.etherscan.io'; break;
    default: prefix = 'https://etherscan.io';
  }
  
  const log = (text) => {
    const result = text
      .replace(/@address{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@token{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@tx{(.+?)}/g, `${prefix}/tx/$1`);
    console.log(result);
    fs.appendFileSync(`report.${network}.log`, `${result}\n`);
  }
  
  const logRevert = async (tryBlock, catchBlock) => {
    try {
      await tryBlock();
    } catch (e) {
      const txHash = Object.keys(e.data)[0]
      const reason = e.data[txHash].reason
      catchBlock(txHash, reason);
    }
  }
  
  return { log, logRevert }
}

module.exports = { logger };
