const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");
const constant = require("./constant");

describe("Pseudo Radom Number Generator", function () {
  let randomNumberContract;
  let accounts;
  let oracleEntropy;
  let clientEntropy;
  const oracleMsg = crypto.randomBytes(256).toString("hex");
  const clientMsg = crypto.randomBytes(256).toString("hex");

  before(async () => {
    const PRNG = await ethers.getContractFactory("PRNG");
    randomNumberContract = await PRNG.deploy();
    accounts = await ethers.getSigners();
    await randomNumberContract.deployed();
    oracleEntropy = [
      accounts[0].address,
      ethers.utils.hashMessage(oracleMsg),
      await accounts[0].signMessage(oracleMsg),
    ];
    clientEntropy = [
      accounts[1].address,
      ethers.utils.hashMessage(clientMsg),
      await accounts[1].signMessage(clientMsg),
    ];
  });

  it("Random and Proving", async function () {
    const random = await randomNumberContract.random(
      clientEntropy,
      oracleEntropy,
      constant.LENGTH_HUNDRED
    );

    const txReceipt = await random.wait();
    const { events } = txReceipt;
    const { args } = events.find(Array);
    const [result, s1, s2, length] = args;

    expect(await randomNumberContract.proving(result, s1, s2, length)).to.equal(
      true
    );
  });

  it("Catching random emitting event", async function () {
    const random = await randomNumberContract.random(
      clientEntropy,
      oracleEntropy,
      constant.LENGTH_HUNDRED
    );

    const txReceipt = await random.wait();
    const { events } = txReceipt;
    const { args } = events.find(Array);
    const [result, s1, s2, length] = args;
    await expect(random)
      .to.emit(randomNumberContract, "Random")
      .withArgs(result, s1, s2, length);
  });

  it("Sucess proving", async function () {
    expect(
      await randomNumberContract.proving(
        constant.RESULT,
        constant.S1,
        constant.S2,
        constant.LENGTH_HUNDRED
      )
    ).to.equal(true);
  });

  it("Faile proving", async function () {
    expect(
      await randomNumberContract.proving(
        constant.INVALID_RESULT,
        constant.S1,
        constant.S2,
        constant.LENGTH_HUNDRED
      )
    ).to.equal(false);
  });

  it("Should not allow invalid off-chain signed message", async function () {
    await expect(
      randomNumberContract.random(
        clientEntropy,
        constant.INVALID_ENTROPY,
        constant.LENGTH_HUNDRED
      )
    ).revertedWith("random: invalid off-chain entropy");
  });

  it("Should not allow invalid on-chain signed message", async function () {
    await expect(
      randomNumberContract.random(
        constant.INVALID_ENTROPY,
        oracleEntropy,
        constant.LENGTH_HUNDRED
      )
    ).revertedWith("random: invalid on-chain entropy");
  });

  it("Should not allow length is '0'", async function () {
    await expect(
      randomNumberContract.random(
        clientEntropy,
        oracleEntropy,
        constant.LENGTH_ZERO
      )
    ).revertedWith("modifier: length '0' or '1' is not allow");
  });

  it("Should not allow length is '1'", async function () {
    await expect(
      randomNumberContract.random(
        clientEntropy,
        oracleEntropy,
        constant.LENGTH_ONE
      )
    ).revertedWith("modifier: length '0' or '1' is not allow");
  });
});
