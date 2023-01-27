const hre = require("hardhat");

async function main() {
  const TradersAcademyPass = await hre.ethers.getContractFactory("TradersAcademyPass");
  const tradersacademy = await TradersAcademyPass.deploy();

await tradersacademy.deployed();

console.log("TradersAcademy Contract deployed to address: ", tradersacademy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
