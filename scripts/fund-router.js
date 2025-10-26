import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log('🔄 Funding Router with Liquidity...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Funding from account:', deployer.address);

  // Your deployed contract addresses
  const ROUTER_ADDRESS = '0xad8cc77e43f9d04A581823AAd6226E7bEFCc64eE';
  const USDC_ADDRESS = '0xD074F89449D958555044b589f95D1495B899C78e';
  const USDT_ADDRESS = '0x0be11e520783556a3AE727Ab5e752Fb33f97530B';
  const WETH_ADDRESS = '0xbDc4aF3d09de795fD7C900751293ac7a69244ca5';
  const DAI_ADDRESS = '0x8D244d0B49F9C6e7d6DF12c61ac10dA01994D476';

  // Get contract instances
  const MockToken = await ethers.getContractFactory('MockERC20Token');
  const usdc = MockToken.attach(USDC_ADDRESS);
  const usdt = MockToken.attach(USDT_ADDRESS);
  const weth = MockToken.attach(WETH_ADDRESS);
  const dai = MockToken.attach(DAI_ADDRESS);

  // Check current router balances
  console.log('📊 Current Router Balances:');
  const usdcBalance = await usdc.balanceOf(ROUTER_ADDRESS);
  const usdtBalance = await usdt.balanceOf(ROUTER_ADDRESS);
  const wethBalance = await weth.balanceOf(ROUTER_ADDRESS);
  const daiBalance = await dai.balanceOf(ROUTER_ADDRESS);
  
  console.log('   USDC:', ethers.utils.formatUnits(usdcBalance, 6));
  console.log('   USDT:', ethers.utils.formatUnits(usdtBalance, 6));
  console.log('   WETH:', ethers.utils.formatEther(wethBalance));
  console.log('   DAI:', ethers.utils.formatEther(daiBalance));

  // Fund amounts
  const fundAmount = {
    usdc: ethers.utils.parseUnits('100000', 6),
    usdt: ethers.utils.parseUnits('100000', 6),
    weth: ethers.utils.parseEther('50'),
    dai: ethers.utils.parseEther('100000'),
  };

  console.log('\n💰 Funding router with liquidity...');
  
  try {
    await (await usdc.mint(ROUTER_ADDRESS, fundAmount.usdc)).wait();
    console.log('✅ USDC funded');
    
    await (await usdt.mint(ROUTER_ADDRESS, fundAmount.usdt)).wait();
    console.log('✅ USDT funded');
    
    await (await weth.mint(ROUTER_ADDRESS, fundAmount.weth)).wait();
    console.log('✅ WETH funded');
    
    await (await dai.mint(ROUTER_ADDRESS, fundAmount.dai)).wait();
    console.log('✅ DAI funded');
  } catch (error) {
    console.error('❌ Error funding router:', error.message);
    throw error;
  }

  // Check updated balances
  console.log('\n📊 Updated Router Balances:');
  const newUsdcBalance = await usdc.balanceOf(ROUTER_ADDRESS);
  const newUsdtBalance = await usdt.balanceOf(ROUTER_ADDRESS);
  const newWethBalance = await weth.balanceOf(ROUTER_ADDRESS);
  const newDaiBalance = await dai.balanceOf(ROUTER_ADDRESS);
  
  console.log('   USDC:', ethers.utils.formatUnits(newUsdcBalance, 6));
  console.log('   USDT:', ethers.utils.formatUnits(newUsdtBalance, 6));
  console.log('   WETH:', ethers.utils.formatEther(newWethBalance));
  console.log('   DAI:', ethers.utils.formatEther(newDaiBalance));

  console.log('\n✅ Router funded successfully!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});