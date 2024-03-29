require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const {INFURA_API_KEY, MNEMONIC} = process.env;

module.exports = {
  contracts_build_directory: './src/contracts',

  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC, 'https://goerli.infura.io/v3/'+INFURA_API_KEY),
      network_id: '5'
    }
  },
  compilers: {
    solc: {
      version: "0.8.10",
    }
  },
};