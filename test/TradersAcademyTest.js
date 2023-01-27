const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("TradersAcademyPass contract", function () {
// global variables
let TradersAcademyPass;
let tradersacademy;
let owner;
let addr1;
let addr2;
let seedMintCost = ethers.utils.parseUnits("0.01", "ether");
let privateMintCost = ethers.utils.parseUnits("0.0175", "ether");
let publicMintCost = ethers.utils.parseUnits("0.025", "ether");

beforeEach(async function () {
    // Get the ContractFactory and Signers here
    TradersAcademyPass = await ethers.getContractFactory("TradersAcademyPass");
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    tradersacademy = await TradersAcademyPass.deploy();
});

    describe("Deployment", function () {
        it("should set the right owner", async function () {
            expect(await tradersacademy.owner()).to.equal(owner.address);
        });

        it("should let the owner set a new owner", async function () {
            await tradersacademy.transferOwnership(addr1.address);
            expect(await tradersacademy.owner()).to.equal(addr1.address);
        });

        
    });

    describe("Minting", function () {
        it("should let the owner open mintphases", async function () {
            
            await tradersacademy.editMintStatus(true, true, true);
            expect(await tradersacademy.seedMintOpen()).to.be.true;
            expect(await tradersacademy.privateMintOpen()).to.be.true;
            expect(await tradersacademy.publicMintOpen()).to.be.true;

            
        });

        it("should let the owner close mintphases", async function (){
            await tradersacademy.editMintStatus(false, false, false);
            expect(await tradersacademy.seedMintOpen()).to.be.false;
            expect(await tradersacademy.privateMintOpen()).to.be.false;
            expect(await tradersacademy.publicMintOpen()).to.be.false;
        });

        it("should not let anyone else edit the mint status", async function(){
            await expect(tradersacademy.connect(addr1).editMintStatus(true, true, true)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should only let the owner put users on the Seed Round List", async function(){
            await expect(tradersacademy.addToSeedRound(addr1.address)).to.be.ok; 
            await expect(tradersacademy.connect(addr1).addToSeedRound(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should only let approved addresses mint in the seed Mint", async function(){
            await tradersacademy.editMintStatus(true, false, false);
            await tradersacademy.connect(owner).addToSeedRound(addr1.address);
            expect(await tradersacademy.connect(addr1).seedMint({value: seedMintCost})).to.be.ok;
            await expect(tradersacademy.connect(addr2).seedMint({value: seedMintCost})).to.be.revertedWith("You are not eligible for the Seed Round");
        });

        it("should credit an NFT to a user after Seed Round minting", async function () {
            expect(await tradersacademy.balanceOf(addr1.address)).to.equal(0);
            await tradersacademy.editMintStatus(true, true, true);
            await tradersacademy.connect(owner).addToSeedRound(addr1.address);
            await tradersacademy.connect(addr1).seedMint({value: seedMintCost});
            expect(await tradersacademy.balanceOf(addr1.address)).to.equal(1);
        });
        it("should only let the owner put users on the Private Round list", async function(){
            await expect(tradersacademy.privateMint(addr1.address)).to.be.ok;
            await expect(tradersacademy.connect(addr1).addToPrivateRound(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should only let approved addresses mint in the Private Round mint", async function(){
            await tradersacademy.editMintStatus(false, true, false);
            await tradersacademy.connect(owner).addToPrivateRound(addr2.address);
            expect(await tradersacademy.connect(addr2).privateMint({value: privateMintCost})).to.be.ok;
            await expect(tradersacademy.connect(addr1).privateMint({value: privateMintCost})).to.be.revertedWith("You are not eligible for the Private Round");
        });

        it("should credit an NFT to a user after Private Round minting", async function(){
            expect(await tradersacademy.balanceOf(addr2.address)).to.equal(0);
            await tradersacademy.editMintStatus(false, true, false);
            await tradersacademy.connect(owner).addToPrivateRound(addr2.address);
            await tradersacademy.connect(addr2).privateMint({value: privateMintCost});
            expect(await tradersacademy.balanceOf(addr2.address)).to.equal(1);
        });

        it("should let everyone mint in the public mint", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            expect(await tradersacademy.connect(addr1).publicMint({value: publicMintCost})).to.be.ok;
        });

        it("should credit an NFT to a user after public minting", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            expect(await tradersacademy.balanceOf(addr1.address)).to.equal(0);
            await tradersacademy.connect(addr1).publicMint({value: publicMintCost});
            expect(await tradersacademy.balanceOf(addr1.address)).to.equal(1);
        });

        it("should increment the mint per wallet count after minting", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            await tradersacademy.connect(addr1).publicMint({value: publicMintCost});
            expect(await tradersacademy.MintsPerWallet(addr1.address)).to.equal(1);

        });

        it("should let every wallet mint a maximum of 2 NFTs", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            await tradersacademy.connect(addr1).publicMint({value: publicMintCost});
            await tradersacademy.connect(addr1).publicMint({value: publicMintCost});
            await expect(tradersacademy.connect(addr1).publicMint({value: publicMintCost})).to.be.revertedWith("You have already minted the maximum amount of NFTs for your wallet, Thank you");
        });
        it("should halt minting when the owner pauses the contract", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            await expect(tradersacademy.connect(addr1).publicMint({value: publicMintCost})).to.be.ok;
            await tradersacademy.pause();
            await expect(tradersacademy.connect(addr2).publicMint({value: publicMintCost})).to.be.revertedWith("Pausable: paused");
            
        });

        it("should continue minting when the owner unpauses the contract", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            await tradersacademy.pause();
            await tradersacademy.unpause();
            await expect(tradersacademy.connect(addr2).publicMint({value: publicMintCost})).to.be.ok;
        });

        it("should let the owner execute the adminMint function at any time", async function(){
            await tradersacademy.editMintStatus(false, false, false);
            await tradersacademy.adminMint();
            expect(await tradersacademy.balanceOf(owner.address)).to.equal(1);
        })

    });

    describe("Withdrawing", function(){
        it("should allow only the owner to withdraw funds from the contract", async function(){
            await tradersacademy.editMintStatus(false, false, true);
            await tradersacademy.connect(addr1).publicMint({value: publicMintCost});
            await expect(tradersacademy.connect(addr1).withdraw(addr1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await tradersacademy.withdraw(owner.address)).to.be.ok;
        })
    })
});