// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SimpleNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string private baseURI;
    string private extension;

    /** Bridger wallet **/
    address public bridger;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        string memory base = _baseURI();
        return string(abi.encodePacked(base, _tokenId.toString(), extension));
    }

    function walletOfOwner(address _owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    /* Minting */
    function mint(address receiver, uint256 _tokenId) external {
        require(msg.sender == owner() || msg.sender == bridger, 'Access denied');
        _mint(receiver, _tokenId);
    }

    /* Admin */
    function bridgerAddress(address _bridger) external onlyOwner {
        bridger = _bridger;
    }

    function setBaseURI(string memory _base) external onlyOwner {
        baseURI = _base;
    }

    function setExtension(string memory ext) external onlyOwner {
        extension = ext;
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(os);
    }
}