const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("Pseudo Radom Number Generator", function () {
  it("Random and Proving", async function () {
    const PRNG = await ethers.getContractFactory("PRNG");
    const randomNumberContract = await PRNG.deploy();
    const accounts = await ethers.getSigners();
    await randomNumberContract.deployed();

    const oracleMsg = crypto.randomBytes(256).toString("hex");
    const clientMsg = crypto.randomBytes(256).toString("hex");

    const oracleEntropy = [
      accounts[0].address,
      ethers.utils.hashMessage(oracleMsg),
      await accounts[0].signMessage(oracleMsg),
    ];

    const clientEntropy = [
      accounts[1].address,
      ethers.utils.hashMessage(clientMsg),
      await accounts[1].signMessage(clientMsg),
    ];

    const randLength = 1000;
    const random = await randomNumberContract.random(
      clientEntropy,
      oracleEntropy,
      randLength
    );

    const txReceipt = await random.wait();
    const { events } = txReceipt;
    const { args } = events.find(Array);
    const [result, s1, s2, length] = args;

    expect(await randomNumberContract.proving(result, s1, s2, length)).to.equal(
      true
    );
  });
});
