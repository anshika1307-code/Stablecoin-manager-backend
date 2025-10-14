// import "@nomiclabs/hardhat-ethers";
// import * as dotenv from "dotenv";

// dotenv.config();

// export const solidity = "0.8.20";
// export const networks = {
//     sepolia: {
//         url: process.env.RPC_URL,
//         accounts: [process.env.PRIVATE_KEY]
//     }
// };


import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";
dotenv.config();

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
