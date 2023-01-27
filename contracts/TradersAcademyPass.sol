// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract TradersAcademyPass is ERC721, ERC721Enumerable, Pausable, Ownable, ReentrancyGuard{
    using Counters for Counters.Counter;
    uint8 seedRoundSupply = 10;
    uint8 capPerWallet = 2;
    uint16 privateRoundSupply = 10;
    uint16 public maxSupply = 50;
    bool public seedMintOpen;
    bool public privateMintOpen;
    bool public publicMintOpen;
    
    
    // storing wallets eligible for seedRound minting
    mapping(address => bool) public seedRound;
    // storing wallets eligible for privateRound minting
    mapping(address => bool) public privateRound;
    // keeping track of number of NFTs minted per wallet
    mapping(address => uint) public MintsPerWallet;

    Counters.Counter public tokenIdCounter;
    

    constructor() payable ERC721("TradersAcademyPass", "TAP"){}

   function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/QmcdWiWd2Bt2SNYQumdnkVuwmfAY7atsWR9MUQ1CvdU6Kn/";
    }

    function tokenURI(uint tokenId) public view override returns (string memory){
        require(_exists(tokenId), "This Token does not exist");
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setSeedRound(address[] calldata addresses) external onlyOwner {
        for(uint i = 0; i < addresses.length; i++){
            seedRound[addresses[i]] = true;
        }
    }

    function addToSeedRound(address seedRoundAddress) external onlyOwner {
        seedRound[seedRoundAddress] = true;
    }

    function setPrivateRound(address[] calldata privateRoundAddresses) external onlyOwner {
        for(uint i = 0; i < privateRoundAddresses.length; i++){
            privateRound[privateRoundAddresses[i]] = true;
        }
    }

        function addToPrivateRound(address privateRoundAddress) external onlyOwner {
            privateRound[privateRoundAddress] = true;
        }

        // open and close the Mint phases
    function editMintStatus(bool _seedMintOpen, bool _privateMintOpen, bool _publicMintOpen) external onlyOwner {
        seedMintOpen = _seedMintOpen;
        privateMintOpen = _privateMintOpen;
        publicMintOpen = _publicMintOpen;
    }

    function seedMint() public payable nonReentrant {
        require(seedMintOpen, "Seed Round Mint is closed");
        // Add payment
        require(msg.value == 0.01 ether, "seed minting cost is 0.01 ether");
        // ensure correct supply
        require(totalSupply() < seedRoundSupply, "Seed Round Mint is sold out");
        // ensure only authorized wallets can mint
        require(seedRound[msg.sender], "You are not eligible for the Seed Round");
        internalMint();
        // remove wallet from the seedList
        seedRound[msg.sender] == false;
        // increase wallet's mintcount
        MintsPerWallet[msg.sender] += 1;
    }

    function privateMint() public payable nonReentrant {
        require(privateMintOpen, "Private Round mint is closed");
        // Add payment
        require(msg.value == 0.0175 ether, "private minting cost is 0.0175 ether");
        // ensure correct supply
        require(totalSupply() < (seedRoundSupply + privateRoundSupply), "Private Round Mint is sold out");
        // ensure only authorized wallets can mint
        require(privateRound[msg.sender], "You are not eligible for the Private Round");
        internalMint();
        // remove wallet from the privateList
        privateRound[msg.sender] == false;
        // increase wallet's mintcount
        MintsPerWallet[msg.sender] += 1;
    }

    function publicMint() public payable nonReentrant  {
        require(publicMintOpen, "public mint is closed");
        // Add payment
        require(msg.value == 0.025 ether, "public minting cost is 0.025 ether");
        // Add limiting of supply
        require(totalSupply() < maxSupply, "This collection has minted out");
        // Add limiting of supply per wallet
        require(MintsPerWallet[msg.sender] < capPerWallet, "You have already minted the maximum amount of NFTs for your wallet, Thank you");
        internalMint();
        // increase wallet's mintCount
        MintsPerWallet[msg.sender] += 1;
    }

    function internalMint() internal {
        // ensure correct supply
        require(totalSupply() < maxSupply, "This collection has minted out");
        // generate TokenId
        uint newTokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        _safeMint(msg.sender, newTokenId);
    }

    function adminMint() public onlyOwner {
        internalMint();
    }

    function withdraw(address addr) external onlyOwner {
        (bool sent, ) = addr.call{value: address(this).balance}("");
        require(sent, "withdraw failed");
    }

    function _beforeTokenTransfer(address from, address to, uint tokenId, uint batchSize)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}