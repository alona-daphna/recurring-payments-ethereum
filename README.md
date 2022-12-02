# recurring-payments-ethereum
Recurring payments on the ethereum blockchain
<br/>
### Technicals
This app is still unfinished
<br/>
Technology used: 
Frontend - React, ethersjs;
Backend - Solidity, Truffle, javascript for tests
<br/>
Git clone & npm install, then npm run start to start the app. 
<br/>
You will need Metamask browser extension to use the app.
<br/>
The contract is published on Goerli testnet so feel free to try it with GoerliETH.
<br/>
### About the contract
As of now, timing execution of a function is not possible in Solidity. In other words, we cannot tell a solidity function to be executed at a certain time in the future.
<br/> A contract is essentially a collection of function declarations and variables. 
<br/> So, the call to these functions we do in the frontend with a web3 library. 
<br/> There were many logical and technological limitations as I planned this app considering this nature of solidity contracts, and at last, I came up with a compromise.
<br/>
<br/>
The logic goes like this:
<br />
Users play both parts of the equation, they can be payee and also payer.
User A can create a new recurring payment with user B as the receiver address, amount of ETH to send every interval and the interval in seconds. Once user A creates the payment, the payment status is still "inactive" and is shown in the deactivated payments tab. User A needs to fund the payment to make it active. He enters the payment id of which he wants to send funds to, and the amount of funds he sends essentially dictate how long the payment will last.
Once those funds get depleted (which I will soon explain how), the payment automatically gets deactivated and user A can send more funds to activate it again if he so chooses to. User A can also send more funds before they get depleted to longate the term of the payment, or he can deactivate it himself and withdraw the funds left for that payment. But how do funds get depleted and how does the payee get paid? Essentially, User B, the payee, can claim the funds he is entitled to anytime. There is a function that calculates claimable funds of all the incoming payments for an address. So in a click of a button, the payee collects all the funds he is entitled to from all his incoming payments which are shown in the 'incoming payments' tab. If a payment gets deactivated before the payee had the chance to collect the funds, the function responsible for the deactivation does that for him. 
<br/>
<br/>
For better understanding, the workflow goes like this:
<br/>
- New payment is created by Payer 
- The payment is added to the deactivated payments tab
- The Payer funds the payment
- Once there are sufficient funds for a payment, the Payer can activate it
- It goes to the outgoing payments tab
- Payee can now see that payment in their incoming payments tab
- Payee can collect claimable funds from all their incoming payments at once
- Payer can deactivate payment any time, when doing so, the claimable funds are transfered to Payee
- Once funds get depleted for a specific payment, the payment gets deactivated
- The Payer can refund a payment to make it active again
- The Payer can also send more funds or withdraw funds from an active payment and shorten or longate the payment term respectively

### some photos along the journey
![image](https://user-images.githubusercontent.com/74145815/205309188-e048037b-d351-41bc-abfe-5936d24d9d04.png)
When the tests I wrote for the contract finally all worked. I have never felt such happiness>>
<br/> 
![create new payment](https://user-images.githubusercontent.com/74145815/205309761-a2cf0f86-26ba-4473-9560-d57e54e3e0bb.png)
It is not much, but I was proud of this little popup I wrote in react. I'm quite horrendous when it comes to ui and frontend frameworks.

![main](https://user-images.githubusercontent.com/74145815/205310251-0ebff809-6808-445a-b22e-5bd8962d0f86.png)
This is how the app looks. I know.. Horrendous...

### what now
As I said, this app is still not finished. I finished writing and testing the contract and deployed it to a testnet. I also somewhat designed the layout for the app and allowed for metamask wallet connection. I connected the 'create new payment' button to the contract function and had it spit out the revert reason when the function reverts (kind of, still needs some work).
<br/> What's left is to connect the fund and withdraw buttons, claim funds button, the whole deactivation mechanism in the frontend, and actually presenting the payments in the corresponding tabs.

