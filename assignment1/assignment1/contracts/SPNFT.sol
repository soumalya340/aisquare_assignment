// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SPNFT is
    Context,
    ERC721Enumerable,
    ERC721Burnable,
    ERC2981,
    AccessControl
{
    // bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 private _nextTokenId;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    event SPNFTAssetCreated(
        uint256 tokenID,
        address indexed creator,
        string metaDataURI
    );
    event SPNFTAssetDestroyed(uint indexed tokenId, address ownerOrApproved);

    constructor(address defaultAdmin) ERC721("SPNFT", "SNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    function createAsset(string memory uri) public {
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        _safeMint(_msgSender(), tokenId);
        _tokenURIs[tokenId] = uri;
        emit SPNFTAssetCreated(tokenId, _msgSender(), uri);
    }

    function delegateAssetCreation(
        address creator,
        string memory metadataURI,
        uint96 royaltyPercentBasisPoint
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        _safeMint(creator, tokenId);
        _tokenURIs[tokenId] = metadataURI;

        // Set royalty Info
        require(
            royaltyPercentBasisPoint <= 1000,
            "SPNFT: Royalty can't be more than 10%"
        );
        _setTokenRoyalty(tokenId, creator, royaltyPercentBasisPoint);

        emit SPNFTAssetCreated(tokenId, creator, metadataURI);
        return tokenId;
    }

    function destroyAsset(uint256 tokenId) public {
        require(
            _isAuthorized(_ownerOf(tokenId), _msgSender(), tokenId),
            "SPNFT: Caller is not token owner or approved"
        );
        _burn(tokenId);
        emit SPNFTAssetDestroyed(tokenId, _msgSender());
        _resetTokenRoyalty(tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _requireOwned(tokenId) == _msgSender(),
            "SPNFT: Non-Existent Asset"
        );
        string memory _tokenURI = _tokenURIs[tokenId];

        return _tokenURI;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
