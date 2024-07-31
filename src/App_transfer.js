import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import SimpleTransfer from './contracts/SimpleTransfer.json'; // 假设 ABI 文件位於此處

const App = () => {
  const [account, setAccount] = useState('');
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
        // 請求帳戶許可並獲取帳戶列表
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]); // 設定第一個帳戶為當前帳戶

        const networkId = await web3.eth.net.getId();
        const networkData = SimpleTransfer.networks[networkId];

        if (networkData) {
          const simpleTransfer = new web3.eth.Contract(SimpleTransfer.abi, networkData.address);
          setContract(simpleTransfer);
          setContractAddress(networkData.address);

          const contractBalance = await simpleTransfer.methods.getBalance().call();
          setBalance(web3.utils.fromWei(contractBalance, 'ether'));
        } else {
          window.alert('SimpleTransfer contract not deployed to detected network.');
        }
      } catch (error) {
        console.error("User denied account access or other error:", error);
      }
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const setupAccountListener = () => {
    // 監聽帳戶變化事件
    window.ethereum.on('accountsChanged', (accounts) => {
      setAccount(accounts[0]); // 更新狀態中的帳戶
    });
  };

  const handleInputChange = (event) => {
    setAmount(event.target.value);
  };

  const handleTransferChange = (event) => {
    setTransferAmount(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (contract) {
      try {
        await contract.methods.transferToOwner(Web3.utils.toWei(amount, 'ether')).send({ from: account, gas: 3000000 });
        const contractBalance = await contract.methods.getBalance().call();
        setBalance(Web3.utils.fromWei(contractBalance, 'ether'));
      } catch (error) {
        console.error("Error executing transaction:", error);
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

  return (
    <div>
      <h1>Simple Transfer</h1>
      <p>Account: {account}</p>
      <p>Contract Address: {contractAddress}</p>
      <p>Contract Balance: {balance} ETH</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={amount} 
          onChange={handleInputChange} 
          placeholder="Enter amount to transfer to owner" 
        />
        <button type="submit">Transfer to Owner</button>
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