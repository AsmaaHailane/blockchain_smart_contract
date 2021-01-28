pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Token.sol";

// Smart Contract that handle all the exchange 
// Deposit & Withdraw Funds
// Manage Orders - Make or cancel
// Handle Trades - charge fees

// TODO
// [X] Set the fee wheneever we deploy a smart contract
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit tokens
// [X] Withdraw tokens
// [X] Check balances
// [X] Make order
// [ ] Cancel order
// [ ] Fill order
// [ ] Charge fees

contract Exchange {
	using SafeMath for uint;
	// variables of the smart contract
	address public feeAccount;  // the acount that receives exchange fees 	
	uint256 public feePercent;  // the fee percentage
	address constant ETHER = address(0); // store Ether in tokens mapping with blank address 

	mapping(address => mapping(address => uint256)) public tokens;
	// Store the model using mapping
	mapping(uint256 => _Order) public orders;
	uint256 public orderCount;
	mapping(uint256 => bool) public orderCancelled;
	// Events
	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address token, address user,uint amount, uint balance);
	event Order(
		uint id,
		address user,
		address tokenGet,
		uint amountGet,
		address tokenGive,
		uint amountGive,
		uint timestamp
	);

	event Cancel(
		uint256 id,
		address user,
		address tokenGet,
		uint amountGet,
		address tokenGive,
		uint amountGive,
		uint timestamp
	);
	//Structs
	// Model the order using a struct 
	struct _Order{
		uint id;
		address user;
		address tokenGet;
		uint amountGet;
		address tokenGive;
		uint amountGive;
		uint timestamp;
	}

	constructor(address _feeAccount, uint256 _feePercent) public{
 			feeAccount = _feeAccount;
 			feePercent = _feePercent;
     	}


    function() external{
       revert();
    } 	


    function depositEther() payable public {
    	// Keep track of the amount of ether inside the token mapping ; ether doesn't have an address
    	// msg value 
    	 tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value); 
  		 emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);	

    } 

    function withdrawEther(uint _amount) public {
    	require(tokens[ETHER][msg.sender] >= _amount);
    	tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount); 
    	msg.sender.transfer(_amount);
    	emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }	


    function depositToken(address _token, uint256 _amount) public{
    	// which token?
    	// How much?
    	// Track the balance of the exchange : Manage deposit
    	// Send tokens to this contract
    	// TODO: Don't allow Ether deposits
    		require(_token != ETHER);
    		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
  			tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount); 
   		// Emit event 
   			emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);


    } 	

    function withdrawToken(address _token, uint256 _amount) public {
    	// we have enough token to withdraw 
    	 require(_token != ETHER);
    	 require(tokens[_token][msg.sender] >= _amount);
    	tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    	require(Token(_token).transfer(msg.sender, _amount));
    	emit Withdraw(_token, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function balanceof(address _token, address _user) public view returns (uint256){
    	return tokens[_token][_user];
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public{
    	// instanciate the order
    	// generate ids
         orderCount = orderCount.add(1);
    	 orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
   		// emit an event whenever we make an order
   		 emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }

    function cancelOrder(uint256 _id) public{
    	// Take the order of the mapping doesnt work because of immutable
    	// Create new mapping for the canceled order and don't let anyone to fetch it
        // Must be "my" order
        // Must be a valid order 
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        require(_order.id == _id);  // the order must exist
    	orderCancelled[_id] = true;
    	emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }
}




