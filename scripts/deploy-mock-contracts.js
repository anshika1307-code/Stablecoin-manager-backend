import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log('Deploying Mock Contracts...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  console.log('Deploying Mock Tokens...');
  const MockToken = await ethers.getContractFactory('MockERC20Token');

  const usdc = await MockToken.deploy(
    'Mock USD Coin',
    'USDC',
    6,
    ethers.utils.parseUnits('1000000', 6), // 1M initial supply
    ethers.utils.parseUnits('1000', 6)     // 1000 USDC per faucet claim
  );
  await usdc.deployed();
  console.log('Mock USDC deployed to:', usdc.address);

  const usdt = await MockToken.deploy(
    'Mock Tether',
    'USDT',
    6,
    ethers.utils.parseUnits('1000000', 6),
    ethers.utils.parseUnits('1000', 6)
  );
  await usdt.deployed();
  console.log('Mock USDT deployed to:', usdt.address);

  const weth = await MockToken.deploy(
    'Mock Wrapped Ether',
    'WETH',
    18,
    ethers.utils.parseEther('10000'),
    ethers.utils.parseEther('10')
  );
  await weth.deployed();
  console.log('Mock WETH deployed to:', weth.address);

  const dai = await MockToken.deploy(
    'Mock Dai Stablecoin',
    'DAI',
    18,
    ethers.utils.parseEther('1000000'),
    ethers.utils.parseEther('1000')
  );
  await dai.deployed();
  console.log('Mock DAI deployed to:', dai.address);

  console.log('\n Deploying Mock Uniswap V3 Router...');
  const MockRouter = await ethers.getContractFactory('MockUniswapV3Router');
  const router = await MockRouter.deploy();
  await router.deployed();
  console.log('Mock Router deployed to:', router.address);

  // Setup exchange rates
  console.log('\n Setting up exchange rates...');
  const usdcAddr = usdc.address;
  const usdtAddr = usdt.address;
  const wethAddr = weth.address;
  const daiAddr = dai.address;

  const rates = [
    { tokenIn: usdcAddr, tokenOut: usdtAddr, rate: 9995 },
    { tokenIn: usdcAddr, tokenOut: wethAddr, rate: 4 },
    { tokenIn: usdcAddr, tokenOut: daiAddr, rate: 10000000000000 },

    { tokenIn: usdtAddr, tokenOut: usdcAddr, rate: 10005 },
    { tokenIn: usdtAddr, tokenOut: wethAddr, rate: 4 },
    { tokenIn: usdtAddr, tokenOut: daiAddr, rate: 10000000000000 },

    { tokenIn: wethAddr, tokenOut: usdcAddr, rate: 25000000 },
    { tokenIn: wethAddr, tokenOut: usdtAddr, rate: 25000000 },
    { tokenIn: wethAddr, tokenOut: daiAddr, rate: 2500 },

    { tokenIn: daiAddr, tokenOut: usdcAddr, rate: 1 },
    { tokenIn: daiAddr, tokenOut: usdtAddr, rate: 1 },
    { tokenIn: daiAddr, tokenOut: wethAddr, rate: 4 },
  ];

  const tokensIn = rates.map(r => r.tokenIn);
  const tokensOut = rates.map(r => r.tokenOut);
  const rateValues = rates.map(r => r.rate);

  const tx = await router.setExchangeRates(tokensIn, tokensOut, rateValues);
  await tx.wait();
  console.log('Exchange rates configured');

  // Fund router with liquidity
  console.log('\n Funding router with liquidity...');
  const fundAmount = {
    usdc: ethers.utils.parseUnits('100000', 6),
    usdt: ethers.utils.parseUnits('100000', 6),
    weth: ethers.utils.parseEther('50'),
    dai: ethers.utils.parseEther('100000'),
  };

  await (await usdc.mint(router.address, fundAmount.usdc)).wait();
  await (await usdt.mint(router.address, fundAmount.usdt)).wait();
  await (await weth.mint(router.address, fundAmount.weth)).wait();
  await (await dai.mint(router.address, fundAmount.dai)).wait();
  console.log('Router funded with liquidity');


  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      tokens: {
        USDC: usdcAddr,
        USDT: usdtAddr,
        WETH: wethAddr,
        DAI: daiAddr,
      },
      router: router.address,
    },
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
