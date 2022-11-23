import './App.css';
import React, { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const [account, setAccount] = useState('0x0');
  const [balance, setBalance] = useState('0');

  const[connected, setConnected] = useState(false);
  const [installed, setInstalled] = useState(false);

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

  
  return ( 
    <div className="App">
      {!connected &&
        <div className="connection">
          <button className='button' onClick={handleConnect}>Connect you wallet</button>
        </div>
      }

      <div className="connected-account">
        <h2>Account: {account}</h2>
        <h3>Balance: {balance} ETH</h3>
      </div>

      <div className='fund-payment'>
        <form>
          <input type="number" name="name" placeholder='Enter payment ID' />
          <input className='button' type="submit" value="Fund payment" />
        </form>
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
        </div>
        <div className="create-new-payment">
          <button className='button'>Create new payment</button>
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
        </div>
      </div>
    </div>
  );
}


export default App;
