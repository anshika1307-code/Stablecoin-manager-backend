import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log('🚀 Deploying Mock Contracts...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  // Deploy Mock Tokens
  console.log('📝 Deploying Mock Tokens...');
  const MockToken = await ethers.getContractFactory('MockERC20Token');

  // Deploy USDC (6 decimals)
  const usdc = await MockToken.deploy(
    'Mock USD Coin',
    'USDC',
    6,
    ethers.utils.parseUnits('1000000', 6), // 1M initial supply
    ethers.utils.parseUnits('1000', 6)     // 1000 USDC per faucet claim
  );
  await usdc.deployed();
  console.log('✅ Mock USDC deployed to:', usdc.address);

  // Deploy USDT (6 decimals)
  const usdt = await MockToken.deploy(
    'Mock Tether',
    'USDT',
    6,
    ethers.utils.parseUnits('1000000', 6),
    ethers.utils.parseUnits('1000', 6)
  );
  await usdt.deployed();
  console.log('✅ Mock USDT deployed to:', usdt.address);

  // Deploy WETH (18 decimals)
  const weth = await MockToken.deploy(
    'Mock Wrapped Ether',
    'WETH',
    18,
    ethers.utils.parseEther('10000'),
    ethers.utils.parseEther('10')
  );
  await weth.deployed();
  console.log('✅ Mock WETH deployed to:', weth.address);

  // Deploy DAI (18 decimals)
  const dai = await MockToken.deploy(
    'Mock Dai Stablecoin',
    'DAI',
    18,
    ethers.utils.parseEther('1000000'),
    ethers.utils.parseEther('1000')
  );
  await dai.deployed();
  console.log('✅ Mock DAI deployed to:', dai.address);

  // Deploy Mock Router
  console.log('\n📝 Deploying Mock Uniswap V3 Router...');
  const MockRouter = await ethers.getContractFactory('MockUniswapV3Router');
  const router = await MockRouter.deploy();
  await router.deployed();
  console.log('✅ Mock Router deployed to:', router.address);

  // Setup exchange rates
  console.log('\n⚙️  Setting up exchange rates...');
  
  const usdcAddr = usdc.address;
  const usdtAddr = usdt.address;
  const wethAddr = weth.address;
  const daiAddr = dai.address;


  const rates = [
    // USDC pairs (6 decimals)
    { tokenIn: usdcAddr, tokenOut: usdtAddr, rate: 9995 },              // USDC → USDT (1:0.9995)
    { tokenIn: usdcAddr, tokenOut: wethAddr, rate: 4000000000000 },    // USDC → WETH (0.0004 with decimals)
    { tokenIn: usdcAddr, tokenOut: daiAddr, rate: 10000000000000 },    // USDC → DAI (1:1 with decimals)
    
    // USDT pairs (6 decimals)
    { tokenIn: usdtAddr, tokenOut: usdcAddr, rate: 10005 },             // USDT → USDC (1:1.0005)
    { tokenIn: usdtAddr, tokenOut: wethAddr, rate: 4000000000000 },    // USDT → WETH (0.0004 with decimals)
    { tokenIn: usdtAddr, tokenOut: daiAddr, rate: 10000000000000 },    // USDT → DAI (1:1 with decimals)
    
    // WETH pairs (18 decimals)
    { tokenIn: wethAddr, tokenOut: usdcAddr, rate: 25000 },            // WETH → USDC (2500 with decimals)
    { tokenIn: wethAddr, tokenOut: usdtAddr, rate: 25000 },            // WETH → USDT (2500 with decimals)
    { tokenIn: wethAddr, tokenOut: daiAddr, rate: 25000000000000 },    // WETH → DAI (2500:1 with decimals)
    
    // DAI pairs (18 decimals)
    { tokenIn: daiAddr, tokenOut: usdcAddr, rate: 10000 },             // DAI → USDC (1:1 with decimals)
    { tokenIn: daiAddr, tokenOut: usdtAddr, rate: 10000 },             // DAI → USDT (1:1 with decimals)
    { tokenIn: daiAddr, tokenOut: wethAddr, rate: 4000000000000 },     // DAI → WETH (0.0004 with decimals)
  ];

  // Set rates in batches to avoid gas issues
  console.log('   Setting rates in batches...');
  const batchSize = 4;
  
  for (let i = 0; i < rates.length; i += batchSize) {
    const batch = rates.slice(i, i + batchSize);
    const tokensIn = batch.map(r => r.tokenIn);
    const tokensOut = batch.map(r => r.tokenOut);
    const rateValues = batch.map(r => r.rate);

    console.log(`   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rates.length / batchSize)}...`);
    
    try {
      const tx = await router.setExchangeRates(tokensIn, tokensOut, rateValues, {
        gasLimit: 500000 // Explicit gas limit
      });
      await tx.wait();
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1} configured`);
    } catch (error) {
      console.error(`   ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      throw error;
    }
  }
  
  console.log('✅ All exchange rates configured');

  // Fund router with liquidity
  console.log('\n💰 Funding router with liquidity...');
  
  const fundAmount = {
    usdc: ethers.utils.parseUnits('100000', 6),
    usdt: ethers.utils.parseUnits('100000', 6),
    weth: ethers.utils.parseEther('50'),
    dai: ethers.utils.parseEther('100000'),
  };

  await (await usdc.mint(router.address, fundAmount.usdc)).wait();
  console.log('   ✅ USDC funded');
  
  await (await usdt.mint(router.address, fundAmount.usdt)).wait();
  console.log('   ✅ USDT funded');
  
  await (await weth.mint(router.address, fundAmount.weth)).wait();
  console.log('   ✅ WETH funded');
  
  await (await dai.mint(router.address, fundAmount.dai)).wait();
  console.log('   ✅ DAI funded');
  
  console.log('✅ Router funded with liquidity');

  // Verify rates
  console.log('\n🔍 Verifying exchange rates...');
  const testRate = await router.exchangeRates(usdcAddr, wethAddr);
  console.log(`   USDC → WETH rate: ${testRate.toString()}`);
  
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

  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log('\n🪙 Mock Tokens:');
  console.log(`   USDC: ${usdcAddr}`);
  console.log(`   USDT: ${usdtAddr}`);
  console.log(`   WETH: ${wethAddr}`);
  console.log(`   DAI:  ${daiAddr}`);
  console.log('\n🔄 Mock Router:');
  console.log(`   Address: ${router.address}`);
  console.log('\n📝 Next Steps:');
  console.log('   1. Update src/hooks/useNexusSwap.ts with these addresses');
  console.log('   2. Update test scripts with these addresses');
  console.log('   3. Run: node scripts/test-swap.js');
  console.log('='.repeat(60) + '\n');

  console.log('📄 Full Deployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => {
    console.log('\n✅ Deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });