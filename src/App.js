import './App.css';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import Recur from "./contracts/Recur.json";
import Popup from './components/Popup';

function App() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner();
  const [account, setAccount] = useState('0x0');
  const [balance, setBalance] = useState('0');

  const [paymentId, setPaymentId] = useState(0);
  const [triggerPopupCreate, setTriggerPopupCreate] = useState(false);
  const [triggerPopupFund, setTriggerPopupFund] = useState(false);
  const [triggerPopupWithdraw, setTriggerPopupWithdraw] = useState(false);


  const[connected, setConnected] = useState(false);
  const [installed, setInstalled] = useState(false);

  const contract = new ethers.Contract(
    '0xf9C3a1922b282943ee0db97bAc1e66b0b8e7BFeD',
    Recur.abi,
    provider);

  const contractWithSigner = contract.connect(signer);

  async function setAccountDetails(account) {
    setAccount(account);
    var balance = await provider.getBalance(account)
    balance = ethers.utils.formatEther(balance)
    setBalance(balance);
  }

  function isMetaMaskInstalled() {
    if (Boolean(window.ethereum && window.ethereum.isMetaMask)) {
      return true;
    } else {
      alert("Install Metamask extension!!");
      return false;
    }
  }

  async function isMetaMaskConnected() {
    const {ethereum} = window;
    const accounts = await ethereum.request({method: 'eth_accounts'});
    if(accounts && accounts.length > 0) {
      setAccountDetails(accounts[0]);
      return true;
    } else {
      setAccount('0x0')
      setBalance('0')
      return false;
    }
  }

  async function initialise() {
    let connected = await isMetaMaskConnected();
    setConnected(connected)
    setInstalled(isMetaMaskInstalled());
  }

  initialise();

  window.ethereum.on('accountsChanged', async () => {
    initialise();
  });

  async function handleConnect() {
    const accounts = await window.ethereum.request({method:'eth_requestAccounts'})
    setAccountDetails(accounts[0])
  }

  function handleCreatePayment() {
      setTriggerPopupCreate(true);
  }

  function handleFundPayment() {
    if(paymentId) {
      setTriggerPopupFund(true);
    }
  }

  function handleWithdraw() {
    if(paymentId) {
      setTriggerPopupWithdraw(true)
    }
  }

  return ( 
    <div className="App">
      {!connected &&
        <div className="connection">
          <button className='button' onClick={handleConnect}>Connect your wallet</button>
        </div>
      }

      <div className="connected-account">
        <h2>Account: {account}</h2>
        <h3>Balance: {balance} ETH</h3>
      </div>

      <div className='fund-payment'>
        <form>
          <input type="button" className='button' value="Withdraw funds" onClick={handleWithdraw} />
          <input type="number" name="name" placeholder='Enter payment ID' onChange={(e) => setPaymentId(e.target.value)}/>
          <input type="button" className='button' onClick={handleFundPayment} value="Fund payment" />
        </form>
        <Popup 
          trigger={triggerPopupFund}
          paymentId={paymentId}
          setTrigger={setTriggerPopupFund}
          button="Fund"
          title="Fund Payment"
          inputs={["amount"]}>
        </Popup>
        <Popup
          trigger={triggerPopupWithdraw}
          paymentId={paymentId}
          setTrigger={setTriggerPopupWithdraw}
          button="Withdraw"
          title="Withdraw Funds"
          inputs={["amount"]}>
        </Popup>
      </div>
      
      <div className="outgoing box">
        <div className="payments-header">
          <h3>Outgoing payments</h3>
        </div>
        <div className="payment-details">
          <p>ID</p>
          <p>Label</p>
          <p>To</p>
          <p>Amount</p>
          <p>Interval</p>
          <p>Remaining</p>
          <p>Funded untill</p>
        </div>
        <div className="create-new-payment">
          <button className='button' onClick={handleCreatePayment}>Create new payment</button>
          <Popup 
          trigger={triggerPopupCreate}
          setTrigger={setTriggerPopupCreate}
          button="Create"
          title="Create New Payment"
          inputs={["label", "to", "amount", "interval"]}>
          </Popup>
        </div>
      </div>

      <div className="incoming box">
        <div className="payments-header">
          <h3>Incoming payments</h3>
        </div>
        <div className="payment-details">
          <p>ID</p>
          <p>Label</p>
          <p>From</p>
          <p>Amount</p>
          <p>Interval</p>
          <p>Available</p>
          <p>Next payment</p>
        </div>
        <div className="claim-funds">
          <button className='button'>Claim funds</button>
        </div>
      </div>

      <div className="deactivated box">
        <div className="payments-header">
          <h3>Deactivated payments</h3>
        </div>
        <div className="payment-details">
          <p>ID</p>
          <p>Label</p>
          <p>From</p>
          <p>Amount</p>
          <p>Interval</p>
          <p>Remaining</p>
        </div>
      </div>
    </div>
  );
}


export default App;
