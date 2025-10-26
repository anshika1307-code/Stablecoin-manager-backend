import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log('🚀 Deploying Additional Mock Stablecoins...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);
  console.log('Balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  // 👇 Update these manually from your first deployment summary
  const  referenceUSDC= '0xF79dd583eDb09c80a0b2FF0cd1B274F1Ec361cA4';
  const referenceUSDT = '0x55e877aEF97A918D3c7f729a691F7DC9831A5695';
  const referenceWETH = '0x6FB9A9D890649d7933d8F3Ccb629eC7300324648';
  const referenceDAI  = '0x4791ECf0cd71e81F243Ccb68112179AD6603Ed4c';
  const routerAddress = '0xBF4082e927886df91a996EbEF07cd4E85B03C300';

  const router = await ethers.getContractAt('MockUniswapV3Router', routerAddress);
  console.log('Using existing router at:', router.address, '\n');

  // 🪙 Token info list (all 6 decimals like other stablecoins)
  const tokenConfigs = [
    { name: 'Mock First Digital USD', symbol: 'FDUSD' },
    { name: 'Mock Binance USD', symbol: 'BUSD' },
    { name: 'Mock TrueUSD', symbol: 'TUSD' },
    { name: 'Mock Pax Dollar', symbol: 'USDP' },
    { name: 'Mock PayPal USD', symbol: 'PYUSD' },
    { name: 'Mock USDD Stablecoin', symbol: 'USDD' },
    { name: 'Mock Gemini Dollar', symbol: 'GUSD' },
  ];

  const MockToken = await ethers.getContractFactory('MockERC20Token');
  const deployedTokens = {};

  for (const cfg of tokenConfigs) {
    console.log(`📝 Deploying ${cfg.symbol}...`);
    const token = await MockToken.deploy(
      cfg.name,
      cfg.symbol,
      6, // 6 decimals
      ethers.utils.parseUnits('1000000', 6), // 1M initial supply
      ethers.utils.parseUnits('1000', 6)     // faucet claim
    );
    await token.deployed();
    console.log(`✅ ${cfg.symbol} deployed at: ${token.address}\n`);
    deployedTokens[cfg.symbol] = token;
  }

  // ⚙️ Setup exchange rates between:
  // - All newly deployed stablecoins <-> existing stables (USDC, USDT, DAI)
  // - All newly deployed stablecoins <-> WETH
  console.log('⚙️ Setting up exchange rates...\n');

  const rates = [];
  const allStables = [
    referenceUSDC,
    referenceUSDT,
    referenceDAI,
    ...Object.values(deployedTokens).map(t => t.address),
  ];

  // 1️⃣ Stable-to-Stable (1:1)
  for (const tokenIn of allStables) {
    for (const tokenOut of allStables) {
      if (tokenIn !== tokenOut) {
        rates.push({ tokenIn, tokenOut, rate: 10000 }); // 1:1 ratio
      }
    }
  }

  // 2️⃣ Stable ↔ WETH (simulate 0.0004 ETH per $1)
  for (const stable of allStables) {
    rates.push({ tokenIn: stable, tokenOut: referenceWETH, rate: 4000000000000 }); // $1 → 0.0004 WETH
    rates.push({ tokenIn: referenceWETH, tokenOut: stable, rate: 25000 });         // 1 WETH → $2500
  }

  // Batch setup
  const batchSize = 4;
  for (let i = 0; i < rates.length; i += batchSize) {
    const batch = rates.slice(i, i + batchSize);
    const tokensIn = batch.map(r => r.tokenIn);
    const tokensOut = batch.map(r => r.tokenOut);
    const rateValues = batch.map(r => r.rate);

    console.log(`   Setting rates batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rates.length / batchSize)}...`);
    try {
      const tx = await router.setExchangeRates(tokensIn, tokensOut, rateValues, {
        gasLimit: 700000,
      });
      await tx.wait();
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1} configured`);
    } catch (err) {
      console.error(`   ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, err.message);
    }
  }

  console.log('✅ All exchange rates configured!\n');

  // 💰 Fund router with liquidity for each new token
  console.log('💰 Funding router with liquidity...');
  const fundAmount = ethers.utils.parseUnits('50000', 6); // 50K per token

  for (const [symbol, token] of Object.entries(deployedTokens)) {
    try {
      const tx = await token.mint(router.address, fundAmount);
      await tx.wait();
      console.log(`   ✅ ${symbol} funded`);
    } catch (err) {
      console.error(`   ❌ Failed to fund ${symbol}:`, err.message);
    }
  }

  console.log('\n✅ Router funded with all new tokens!\n');

  // 📋 Deployment summary
  const summary = {
    deployer: deployer.address,
    router: router.address,
    network: (await ethers.provider.getNetwork()).name,
    timestamp: new Date().toISOString(),
    tokens: Object.fromEntries(Object.entries(deployedTokens).map(([s, c]) => [s, c.address])),
  };

  console.log('='.repeat(60));
  console.log('📋 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  for (const [symbol, token] of Object.entries(deployedTokens)) {
    console.log(`   ${symbol}: ${token.address}`);
  }
  console.log(`\n🔄 Router: ${router.address}`);
  console.log('='.repeat(60));
  console.log('\n📄 JSON Summary:\n', JSON.stringify(summary, null, 2));
}

main()
  .then(() => {
    console.log('\n✅ Extra tokens deployed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
