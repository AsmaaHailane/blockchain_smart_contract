import { tokens , EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'

const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')


require('chai')
		.use(require('chai-as-promised'))
		.should()
// web3 has an utility to convert from eth to wei and  <=

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
	//declare 
	let token
	let exchange
	const feePercent = 10

 	beforeEach(async () => {
 		// Deploy Token
 		token = await Token.new()
 		// Transfer some token to user1 
 		token.transfer(user1, tokens(100), { from: deployer})
  		//fetch exchange from blockchain
  		exchange = await Exchange.new(feeAccount, feePercent)
  	})


 	describe('deployment',() => {
		it('tracks the fee account',async() => {
			const result = await exchange.feeAccount()
			result.should.equal(feeAccount)

		})

		it('tracks the fee percent',async() => {
			const result = await exchange.feePercent()
			result.toString().should.equal(feePercent.toString())

		})
		
	})

	describe('fallback', async() => {
		it('reverts when Ether is sent', async() => {
		  await exchange.sendTransaction({ value: 1,  from: user1}).should.be.rejectedWith(EVM_REVERT)
		})
	})

 	describe('deposit Ether', async() => {
 		let result
 		let amount

 		beforeEach(async() => {
 			amount = ether(1)
 			result = await exchange.depositEther({ from: user1, value: amount })
 		})

 		it('tracks the Ether deposit', async() => {
 			const balance = await exchange.tokens(ETHER_ADDRESS, user1)
 			balance.toString().should.be.equal(amount.toString())
 		})

 		it('Emit a Deposit event', async() => {

					const log = result.logs[0]
					log.event.should.equal('Deposit')
					const event = log.args
					event.token.should.equal(ETHER_ADDRESS,'ether address  is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal(amount.toString(),'balance is correct')
		})
 	})
 
    
 	describe('withdraw Ether', () => {
 		let result
 		let amount

 		beforeEach(async() => {
 				// Deposit ether first before withdraw
 				amount = ether(1)
 				await exchange.depositEther({ from: user1, value: amount})
 			})

 		describe('success', () => {

 		  beforeEach(async() => {
 				// Wthdraw Ether 
 				result = await exchange.withdrawEther(amount, { from: user1})
 			})

 		  it('withdraw Ether funds', async() =>
 		  	 {
 		  	 	let balance = await exchange.tokens(ETHER_ADDRESS, user1)
 		  	 	console.log(balance)
 		  	 	balance.toString().should.equal('0')
 		  	 })

 		  it('Emit a withdraw event', async() => {

					const log = result.logs[0]
					log.event.should.equal('Withdraw')
					const event = log.args
					event.token.should.equal(ETHER_ADDRESS,'ether address  is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal('0','balance is correct')
		  })

 		 }) 

 		
 		describe('failure', () => {
 		   it('rejects withdraws for insufficient balances', async() => {
 		   		await exchange.withdrawEther(ether(100), { from: user1}).should.be.rejectedWith(EVM_REVERT)
 		   })
 		})

 	})


 	describe('depositing tokens',() => {
 		let result
 		let amount

		
		describe('success', () => {
			
			beforeEach(async() => {

			amount = tokens(10)
			await token.approve(exchange.address, amount, { from: user1 })
			result = await exchange.depositToken(token.address, tokens(10), {from: user1})
			
			})


			it('tracks the token deposit',async() => {
				// check exchange token balance 
				let balance
				balance = await token.balanceOf(exchange.address)
				balance.toString().should.equal(amount.toString())
				balance = await exchange.tokens(token.address, user1)
				balance.toString().should.equal(amount.toString())

			})

			it('Emit a Deposit event', async() => {

					const log = result.logs[0]
					log.event.should.equal('Deposit')
					const event = log.args
					event.token.should.equal(token.address,'token address  is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal(amount.toString(),'balance is correct')
			})
		})

		describe('failure', () => {
			
			it('rejects Ether deposit', async() =>{
				await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('fails when no tokens are approved', async() => {
				// Don't apprive any tokens before depositing
				await exchange.depositToken(token.address, tokens(10), { from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
		
	})

	describe('withdraw tokens', () => {
 		let result
 		let amount

 		
 			describe('success', () => {

 		 		 beforeEach(async() => {
 		  			// Deposit tokens first
		 		  		amount = tokens(10)
		 		  		await token.approve(exchange.address, amount, { from: user1})
		 		  		await exchange.depositToken(token.address, amount, { from: user1})

		 				// Wthdraw Ether 
		 				result = await exchange.withdrawToken(token.address, amount, { from: user1})
		 		})

	 		 	it('withdraw token funds', async() =>{
 	 		  	 	let balance = await exchange.tokens(ETHER_ADDRESS, user1)
	 		  	 	console.log(balance)
	 		  	 	balance.toString().should.equal('0')
	 		  	})

 		  		it('Emit a withdraw token', async() => {
					const log = result.logs[0]
					log.event.should.equal('Withdraw')
					const event = log.args
					event.token.should.equal(token.address,'token address  is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal('0','balance is correct')
				})
		    })

 		   describe('failure', () => {
 				// using ether address and not token address
 		    	it('rejects Ether withdraws', () => {
       				exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
     			})

     		    it('fails for insufficient balances', () => {
       			// Attempt to withdraw tokens without depositing any first
       				exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
     			 })
   			 })

 	}) 
		   
	 describe('checking balances', () => {
   			beforeEach(async () => {
    await exchange.depositEther({ from: user1, value: ether(1) })
   			})

   it('returns user balance', async () => {
     const result = await exchange.balanceof(ETHER_ADDRESS, user1)
     result.toString().should.equal(ether(1).toString())
   })
  })


describe('making orders', () => {
   let result

   beforeEach(async () => {
     result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
   })

   it('tracks the newly created order', async () => {
     const orderCount = await exchange.orderCount()
     console.log("orderCount",orderCount)
     orderCount.toString().should.equal('1')
     const order = await exchange.orders('1')
     console.log("order",order)
     order.id.toString().should.equal('1', 'id is correct')
     order.user.should.equal(user1, 'user is correct')
     order.tokenGet.should.equal(token.address, 'tokenGet is correct')
     order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
     order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
     order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
     order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
   })

    it('emits an "Order" event', () => {
     const log = result.logs[0]
     log.event.should.eq('Order')
     const event = log.args
     event.id.toString().should.equal('1', 'id is correct')
     event.user.should.equal(user1, 'user is correct')
     event.tokenGet.should.equal(token.address, 'tokenGet is correct')
     event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
     event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
     event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
     event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
   })

  
  })

   
   describe('order actions', () => {

    beforeEach(async () => {
      // user1 deposits ether only
      await exchange.depositEther({ from: user1, value: ether(1) })
      // give tokens to user2
      await token.transfer(user2, tokens(100), { from: deployer })
      // user2 deposits tokens only
      await token.approve(exchange.address, tokens(2), { from: user2 })
      await exchange.depositToken(token.address, tokens(2), { from: user2 })
      // user1 makes an order to buy tokens with Ether
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })
         
         describe('cancelling orders', () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder('1', { from: user1 })
        })

        it('updates cancelled orders', async () => {
          const orderCancelled = await exchange.orderCancelled(1)
          orderCancelled.should.equal(true)
        })

        it('emits a "Cancel" event', () => {
          const log = result.logs[0]
          log.event.should.eq('Cancel')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
      })

      describe('failure', () => {
        it('rejects invalid order ids', () => {
          const invalidOrderId = 99999
          exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects unauthorized cancelations', async () => {
          // Try to cancel the order from another user
          await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
     
    })
 	
})




	
	
