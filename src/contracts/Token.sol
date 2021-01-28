pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
	using SafeMath for uint;

	// ******* Variables ********
	//basic smoke test
	//set name in order to read it from outside 
	// attributes that can be store in the blockchain
     string public name = "DApp Token";	
      // set  symbol 
     string public symbol = "DAPP";
      // set decimals
     uint256 public decimals =18;
      // set totalsupply
     uint256 public totalSupply;

     // Track balances : we need a way to store the balances
     // store how many token a user have 
     // states variables belongs to a smart contract 
     // immutable 
     // mapping : new type like hashmap where we associate a key to a value 
     // expose balance key is the address and the value is balance
     // must be positive
     mapping(address => uint256) public balanceOf; 
     // keep track  nested mapping
     // multiple exchange 
     mapping(address => mapping(address => uint256)) public allowance;

     // ******* Event  *******
     		// optimize by filtring
      event Transfer(address indexed from, address to, uint256 value);
      event Approval(address indexed _owner, address indexed _spender, uint256 _value);
       
       constructor() public {
     	totalSupply = 1000000 * (10 **decimals);
     	// key msg.sender the person who deploy the smart contract
     	balanceOf[msg.sender] = totalSupply; // the first account in ganache
       }


     // Send tokens
     // using the transfer function from the standard
     
     function transfer(address _to, uint256 _value) public returns (bool success){
        // if it's true => continue process
        // if false =>  stop and don't trig the next
        // statememnt
        // test for failure if the sender doesnt have enough tokens to send
        require(balanceOf[msg.sender] >= _value );
        _transfer(msg.sender , _to, _value );
         
         return true;
     }

     function _transfer(address _from , address _to, uint256 _value) internal {

        require(_to != address(0));
        // decrease the balance of the sender
        balanceOf[_from] = balanceOf[_from].sub(_value); 
        
        // increase the receiver balance 
        balanceOf[_to] = balanceOf[_to].add(_value);
        
        // trig and fire the event
        emit Transfer(_from, _to,_value);
         
     }
 
     	// Approve tokens
     	// allow someone to spend owr token

     	function approve(address _spender, uint256 _value) public returns (bool success){
     		// behavior
     		require(_spender!= address(0));
     		allowance[msg.sender][_spender] = _value;
     		emit Approval(msg.sender, _spender , _value);

     		return true;
     	}


     	// Transfer from make the trade
     	// allow someone else to do the transfer 

     	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
     			// same thing as transfer plus 
     		require(_value <= balanceOf[_from]);
     		require(_value <= allowance[_from][msg.sender]);
     		allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
     		_transfer(_from, _to, _value);
     		
     		return true;
     	}


    
}