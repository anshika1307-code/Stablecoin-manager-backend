async function main() {
  const Swap = await ethers.getContractFactory("StablecoinSwap");
  const swap = await Swap.deploy();
  await swap.deployed();
  console.log("Swap contract deployed to:", swap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
