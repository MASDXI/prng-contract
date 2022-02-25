const hre = require("hardhat");

async function main() {
  const PRNG = await hre.ethers.getContractFactory("PRNG");
  const randomContract = await PRNG.deploy();

  await randomContract.deployed();

  console.log(
    "Pseudo Random Number Generator Contract deployed to:",
    randomContract.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
