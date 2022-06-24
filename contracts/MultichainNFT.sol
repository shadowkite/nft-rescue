// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@dea-sg/layerzero/contracts/interfaces/ILayerZeroEndpoint.sol";
import "@dea-sg/layerzero/contracts/interfaces/ILayerZeroReceiver.sol";
import "./NonblockingReceiver.sol";

contract MultichainNFT is ERC721Enumerable, Ownable, NonblockingReceiver {
    using Strings for uint256;

    event BridgeRequest(address receiver, uint16 target, uint256 tokenId);
    event ReceiveNFT(uint16 _srcChainId, address _from, uint256 _tokenId);

    string private baseURI;

    /** Bridger wallet **/
    address public bridger;

    bool projectTraverseEnabled = false;
    mapping(bytes32 => bool) public handledMessages;
    mapping(uint16 => uint256) public gasCosts;

    uint256 lzGas = 350000;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        string memory base = _baseURI();
        return string(abi.encodePacked(base, _tokenId.toString(), '.json'));
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

    function setEndpoint(address _endpoint) public onlyOwner {
        endpoint = ILayerZeroEndpoint(_endpoint);
    }

    function setGas(uint256 _gas) public onlyOwner {
        lzGas = _gas;
    }

    function setGasCosts(uint16 _target, uint256 _gas) public onlyOwner {
        gasCosts[_target] = _gas;
    }

    function setProjectTraverseEnabled(bool _enabled) public onlyOwner {
        projectTraverseEnabled = _enabled;
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(os);
    }

    /* BCH Bridge */
    function projectTraverseChains(uint16 _target, uint256 _tokenId) public payable {
        require(projectTraverseEnabled != false, "Project traverse route disabled");
        require(msg.sender == ownerOf(_tokenId), "Not owner");
        require(gasCosts[_target] <= msg.value, "Not enough gas");

        _burn(_tokenId);
        emit BridgeRequest(msg.sender, _target, _tokenId);
    }

    function projectReceive(bytes32 _msgId, address _receiver, uint256 _tokenId) public {
        require(msg.sender == bridger, 'You are not a bridger');
        require(!handledMessages[_msgId], 'Already handled');

        handledMessages[_msgId] = true;
        _mint(_receiver, _tokenId);
    }

    /* Layer Zero */
    function traverseChains(uint16 _dstChainId, uint256 _tokenId) public payable {
        require(msg.sender == ownerOf(_tokenId), "Not the owner");
        _burn(_tokenId);

        bytes memory payload = abi.encode(msg.sender, _tokenId);
        uint16 version = 1;
        bytes memory adapterParams = abi.encodePacked(version, lzGas);
        (uint256 messageFee, ) = endpoint.estimateFees(_dstChainId, address(this), payload, false, adapterParams);

        require(msg.value >= messageFee, "Must send enough value to cover messageFee");
        endpoint.send{value: msg.value}(_dstChainId, trustedRemoteLookup[_dstChainId], payload, payable(msg.sender), address(0x0), adapterParams);
    }

    function _LzReceive(uint16 _srcChainId, bytes memory, uint64, bytes memory _payload) internal override {
        (address toAddress, uint256 tokenId) = abi.decode(_payload, (address, uint256));
        _safeMint(toAddress, tokenId);
        emit ReceiveNFT(_srcChainId, toAddress, tokenId);
    }

    function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view returns (uint256 nativeFee, uint256 zroFee) {
        return endpoint.estimateFees(
            _dstChainId,
            _userApplication,
            _payload,
            _payInZRO,
            _adapterParams
        );
    }
}