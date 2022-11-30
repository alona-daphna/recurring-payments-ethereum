const HDWalletProvider = require('@truffle/hdwallet-provider');
const {INFURA_API_KEY, MNEMONIC} = process.env;

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
    },
    goerli: {
      provider: () => new HDWalletProvider(
        MNEMONIC,
        INFURA_API_KEY
      ),
      network_id: 5
    }
  },
  compilers: {
    solc: {
      version: "0.8.10",
    }
  },
};
