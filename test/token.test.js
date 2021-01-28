import { tokens , EVM_REVERT } from './helpers'
const Token = artifacts.require('./Token')

require('chai')
		.use(require('chai-as-promised'))
		.should()
// web3 has an utility to convert from eth to wei and  <=

contract('Token', ([deployer, receiver, exchange]) =>{
	const name = 'DApp Token'
	const symbol = 'DAPP'
	const decimals = '18'
	const totalSupply =tokens(1000000)
	
	//declare 
	let token

 	beforeEach(async () =>{
  	//fetch token from blockchain
  	token = await Token.new()
  	})

	describe('deployment',() =>{
		it('tracks the name',async() =>{
			//read token name here...
			const result = await token.name()
			//the token name is 'Myname'
			result.should.equal(name)

		})
		it('tracks the symbol',async() =>{
			const result = await token.symbol()
			result.should.equal(symbol)

		})
		it('tracks the decimals',async() =>{
			
			const result = await token.decimals()
			//consistency
			result.toString().should.equal(decimals)
		})
	  
	  it('tracks the total supply', async ()  => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply.toString())
    	})

      it('assigns the total supply to the deployer', async() =>{

      	const result = await token.balanceOf(deployer)
      	result.toString().should.equal(totalSupply.toString())
      })
	})

	describe('sending tokens',() => {
	   	let amount
	   	let result
	   	describe('success', async() =>{

	   		beforeEach(async () =>{
  			amount = tokens(100)
  			 // Transfer
             result = await token.transfer(receiver, amount, { from: deployer} )
  			})	

			it('transfers token balances', async() => {
			// sender and receiver 
			let balanceOf
			// Before Transfer
			//balanceOf = await token.balanceOf(deployer)
			//console.log("deployer balance before Transfer", balanceOf.toString())
		    //balanceOf = await token.balanceOf(receiver)
			//console.log("receiver balance before Transfer", balanceOf.toString())
       
            // After Transfer 

            balanceOf = await token.balanceOf(deployer)
            balanceOf.toString().should.equal(tokens(999900).toString())
			//console.log("deployer balance after Transfer", balanceOf.toString())
			balanceOf = await token.balanceOf(receiver)
		    balanceOf.toString().should.equal(amount.toString())

			//console.log("receiver balance after Transfer", balanceOf.toString())
            
			it ('emits a transfer event',async() =>{
				// we set result before to trig the event 
				console.log(result)
				const log = result.logs[0]
				log.event.should.equal('Transfer')
				const event = log.args
				event.from.toString().should.equal(deployer,'from is correct')
				event.to.toString().should.equal(receiver,'to is correct')
				event.value.toString().should.equal(amount.toString(),'value is correct')

			})
			})

	   	})
	   	
	   	describe('failure', async() =>{
	   		it('rejects insufficient balance', async() => {
	   			let invalidAmount 
	   			invalidAmount = tokens(10000000) // 100 millions - greater than total supply
	   			await token.transfer(receiver, invalidAmount, { from: deployer})
	   			.should.be.rejectedWith(EVM_REVERT)
	   			
	   			// Attempt transfer when you have none
			    invalidAmount = tokens(10) // recipient has no tokens
				await token.transfer(deployer, invalidAmount, { from: receiver})
	   			.should.be.rejectedWith(EVM_REVERT)	  
	   			 		})	

	   		it('rejects invalid  recipient', async() => {
	   			await token.transfer(0x0, amount, { from: deployer})
	   			.should.be.rejected
	   			
	   		})	
	   	})
		
	})


		describe('approving tokens', () =>{
			let result
			let amount

			beforeEach(async() => {
				amount = tokens(100)
				result = await token.approve(exchange, amount, { from: deployer})
			})

			describe('success' , async() =>{
				it('allocates an allowance for delegated tokens spending on exchange', async() =>{
					const allowance = await token.allowance(deployer, exchange)
					allowance.toString().should.equal(amount.toString())

				})


			it ('emits an Approval event',async() =>{
				// we set result before to trig the event 
				//console.log(result)
				const log = result.logs[0]
				log.event.should.equal('Approval')
				const event = log.args
				event._owner.toString().should.equal(deployer,'owner is correct')
				event._spender.should.equal(exchange,'spender is correct')
				event._value.toString().should.equal(amount.toString(),'value is correct')
					
			})
			})

			describe('failure', async() =>{
				it('rejects invalid spenders', async() => {
					await token.approve(0x0,amount,{ from: deployer}).should.be.rejected
				})
			})


			})



		describe('delegated token transfers',() => {
	   	let amount
	   	let result
	   	
	   			beforeEach(async() => {
	   				amount = tokens(100)	
	   				await token.approve(exchange,amount, { from: deployer})
	   			})		

	   	describe('success', async() =>{

	   		beforeEach(async () =>{
             		result = await token.transferFrom(deployer, receiver, amount, { from: exchange})
  			})	

			it('transfers token balances', async() => {
					let balanceOf
		            balanceOf = await token.balanceOf(deployer)
		            balanceOf.toString().should.equal(tokens(999900).toString())
					balanceOf = await token.balanceOf(receiver)
				    balanceOf.toString().should.equal(tokens(100).toString())

			})
            
            it('resets the allowance', async () => {
			       const allowance = await token.allowance(deployer, exchange)
			       allowance.toString().should.equal('0')
     	    })
			


			it ('emits a transfer event',async() =>{
				// we set result before to trig the event 
			
					const log = result.logs[0]
					log.event.should.equal('Transfer')
					const event = log.args
					event.from.toString().should.equal(deployer,'from is correct')
					event.to.toString().should.equal(receiver,'to is correct')
					event.value.toString().should.equal(amount.toString(),'value is correct')

			})

			})
	   	
	   	describe('failure', async() => {
	   		it('rejects invalid recipient', async() => {
					await token.transferFrom(deployer, 0x0,amount,{ from: deployer}).should.be.rejected
				})

	   	})
		
	})

			
		})


