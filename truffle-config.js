const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = process.env.MNEMONIC;
const infura = process.env.INFURA_KEY;
module.exports = {
  contracts_build_directory: './src/contracts',

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: () => new HDWalletProvider(
        mnemonic,
        `https://rinkeby.infura.io/v3/${infura}`
      ),
      network_id: 4
    }
  },
  compilers: {
    solc: {
      version: "0.8.10",
    }
  },
};
