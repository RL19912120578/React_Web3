import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import SimpleJack from './contracts/SimpleJack.json'; // 假设 ABI 文件位于此处

const App = () => {
  const [account, setAccount] = useState('');
  const [dealerNumber, setDealerNumber] = useState(0);
  const [gamblerNumber, setGamblerNumber] = useState(0);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    loadBlockchainData();
    setupAccountListener();
  }, []);

  const loadBlockchainData = async () => {
    if (window.ethereum) {
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3.eth.net.getId();
        const networkData = SimpleJack.networks[networkId];

        if (networkData) {
          const simpleJack = new web3.eth.Contract(SimpleJack.abi, networkData.address);
          setContract(simpleJack);
          setContractAddress(networkData.address);

          const contractBalance = await simpleJack.methods.getBalance().call();
          setBalance(web3.utils.fromWei(contractBalance, 'ether'));
        } else {
          window.alert('SimpleJack contract not deployed to detected network.');
        }
      } catch (error) {
        console.error("User denied account access or other error:", error);
      }
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const setupAccountListener = () => {
    window.ethereum.on('accountsChanged', (accounts) => {
      setAccount(accounts[0]);
    });
  };

  const handleInputChange = (event) => {
    setAmount(event.target.value);
  };

  const handleTransferChange = (event) => {
    setTransferAmount(event.target.value);
  };

  const generateRandomNumbers = async () => {
    if (contract) {
      try {
        await contract.methods.generateNumbers().send({ from: account });
        const dealerNum = await contract.methods.getDealerNumber().call();
        const gamblerNum = await contract.methods.getGamblerNumber().call();
        setDealerNumber(Number(dealerNum));
        setGamblerNumber(Number(gamblerNum));
      } catch (error) {
        console.error("Error generating numbers:", error);
      }
    }
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    if (contract) {
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
      try {
        await web3.eth.sendTransaction({
          from: account,
          to: contractAddress,
          value: web3.utils.toWei(transferAmount, 'ether'),
          gas: 3000000 // 默认Gas限制为3000000，可以根据需要调整
        });
        const contractBalance = await contract.methods.getBalance().call();
        setBalance(Web3.utils.fromWei(contractBalance, 'ether'));
      } catch (error) {
        console.error("Error sending transaction:", error);
      }
    }
  };

  // const handleTransferSubmit = async (event) => {
  //   event.preventDefault();
  //   if (contract) {
  //     try {
  //       await contract.methods.transferTo(account, Web3.utils.toWei(amount, 'ether')).send({ from: account });
  //       const contractBalance = await contract.methods.getBalance().call();
  //       setBalance(Web3.utils.fromWei(contractBalance, 'ether'));
  //     } catch (error) {
  //       console.error("Error transferring funds:", error);
  //     }
  //   }
  // };

  return (
    <div>
      <h1>Simple Jack</h1>
      <p>Account: {account}</p>
      <p>Contract Address: {contractAddress}</p>
      <p>Contract Balance: {balance} ETH</p>
      <p>Dealer Number: {dealerNumber}</p>
      <p>Gambler Number: {gamblerNumber}</p>
      <button onClick={generateRandomNumbers}>Generate Numbers</button>
      <form onSubmit={handleTransferSubmit}>
        <input 
          type="text" 
          value={amount} 
          onChange={handleInputChange} 
          placeholder="Enter amount to withdraw" 
        />
        <button type="submit">Withdraw</button>
      </form>
      <form onSubmit={handleTransferSubmit}>
        <input 
          type="text" 
          value={transferAmount} 
          onChange={handleTransferChange} 
          placeholder="Enter amount to send to contract" 
        />
        <button type="submit">Send to Contract</button>
      </form>
    </div>
  );
};

export default App;