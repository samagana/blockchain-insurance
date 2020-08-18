pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

contract Insurance {
    address payable private owner;
    address private police;

    Product[] private products;
    Claim[] private allClaims;
    mapping(address => mapping(uint8 => InsuranceDetails)) private insurance;
    
    constructor(address _police) public {
        owner = msg.sender;
        police = _police;
    }
    
    struct Product {
        string name;
    }
    
    struct Claim {
        uint8 productIndex;
        uint256 amount;
        address claimedBy;
        bool isApproved;
        bool isRejected;
        uint time;
    }

    struct InsuranceDetails {
        bool isPurchased;
        bool isClaimed;
        uint256 premium;
        uint256 amount;
    }
    
    modifier isPolice() {
        require(msg.sender == police,"Only Police can call this function");
        _;
    }
    
    modifier isNotPolice() {
        require(msg.sender != police,"Police Cant purchase Insurance");
        _;
    }
    
    modifier isOwner() {
        require(msg.sender == owner, "Only owners can call this function");
        _;
    }

    modifier isPolicyOrOwner() {
        require(msg.sender == owner || msg.sender == police, "Only owners or police can call this function");
        _;
    }

    function addProduct(string memory name) public isOwner {
        products.push(Product(name));
    }

    function getProducts() public view returns(Product[] memory) {
        return products;
    }

    function getMyInsurance() public view returns(InsuranceDetails[] memory) {
        InsuranceDetails[] memory tempArray = new InsuranceDetails[](products.length);
        uint8 k = 0;
        for (uint8 i=0; i<products.length; i++) {
            tempArray[k] = insurance[msg.sender][i];
            k = k + 1;
        }
        return tempArray;
    }

    function getMyClaims() public view returns(Claim[] memory) {
        Claim[] memory tempClaims = new Claim[](allClaims.length);
        uint k = 0;
        for (uint i=0; i<allClaims.length; i++) {
            if (allClaims[i].claimedBy == msg.sender) {
                tempClaims[k] = allClaims[i];
                k = k + 1;
            }
        }
        return tempClaims;
    }

    function getAllClaims() public view isPolicyOrOwner returns(Claim[] memory) {
        return allClaims;
    }
    
    function buyInsurance(uint8 productIndex, uint256 premium) public {
        require(!insurance[msg.sender][productIndex].isPurchased, "Insurance already purchased");
        insurance[msg.sender][productIndex].premium = premium;
        insurance[msg.sender][productIndex].isPurchased = true;
    }
    
    function payPremium(uint8 productIndex) public payable {
        require(insurance[msg.sender][productIndex].isPurchased, "Insurance not purchased yet");
        require(msg.value >= insurance[msg.sender][productIndex].premium, "EMI is less");
        insurance[msg.sender][productIndex].amount = insurance[msg.sender][productIndex].amount + msg.value;
    }
    
    function claimInsurance(uint8 productIndex, uint256 amount) public {
        require(insurance[msg.sender][productIndex].isPurchased, "Insurance not purchased yet");
        require(!insurance[msg.sender][productIndex].isClaimed, "Insurance already claimed");
        insurance[msg.sender][productIndex].isClaimed = true;
        allClaims.push(Claim(productIndex, amount, msg.sender, false, false, now));
    }
    
    function approveInsurance(uint8 claimId) public isPolice {
        require(allClaims.length > claimId, "No such claim exists!");
        require(!allClaims[claimId].isApproved, "Claim already approved!");
        require(!allClaims[claimId].isRejected, "Claim already rejected!");
        allClaims[claimId].isApproved = true;
        allClaims[claimId].time = now;
        insurance[allClaims[claimId].claimedBy][allClaims[claimId].productIndex].isClaimed = false;
        address payable claimer = address(uint160(allClaims[claimId].claimedBy));
        claimer.transfer(allClaims[claimId].amount);
    }

    function rejectInsurance(uint8 claimId) public isPolice {
        require(allClaims.length > claimId, "No such claim exists!");
        require(!allClaims[claimId].isApproved, "Claim already approved!");
        require(!allClaims[claimId].isRejected, "Claim already rejected!");
        allClaims[claimId].isRejected = true;
        allClaims[claimId].time = now;
        insurance[allClaims[claimId].claimedBy][allClaims[claimId].productIndex].isClaimed = false;
    }
    
    function closeCompany() public isOwner {
        selfdestruct(owner);
    }
    
    function checkUser() public view returns (string memory){
        if(msg.sender == owner)
            return "owner";
        if(msg.sender == police)
            return "police";
        else 
            return "user";
    }
    
    function addFunds() public payable isOwner {
        //
    }
    
    function getBalance() public view isOwner returns (uint256) {
        return address(this).balance;
    }
    
    function transferToOwner() public isOwner {
        owner.transfer(address(this).balance);
    }

}