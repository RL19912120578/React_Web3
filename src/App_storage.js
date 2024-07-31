import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import SimpleStorage from './contracts/SimpleStorage.json'; // 确保 ABI 文件路径正确

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [storageValue, setStorageValue] = useState(0);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    if (window.ethereum) {
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3.eth.net.getId();
        console.log("Network ID:", networkId);
        console.log("SimpleStorage JSON:", SimpleStorage);
        const networkData = SimpleStorage.networks[networkId];

        if (networkData) {
          const simpleStorage = new web3.eth.Contract(SimpleStorage.abi, networkData.address);
          setContract(simpleStorage);

          const value = await simpleStorage.methods.get().call();
          console.log("Storage value:", value);
          setStorageValue(Number(value));
        } else {
          window.alert('SimpleStorage contract not deployed to detected network.');
        }
      } catch (error) {
        console.error("User denied account access or other error:", error);
      }
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const handleInputChange = (event) => {
    setNewValue(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (contract) {
      console.log("Setting new value:", newValue);
      await contract.methods.set(newValue).send({ from: account })
        .on('transactionHash', (hash) => {
          console.log("Transaction hash:", hash);
        })
        .on('receipt', async (receipt) => {
          console.log("Transaction receipt:", receipt);
          const value = await contract.methods.get().call();
          setStorageValue(Number(value));
        })
        .on('error', (error) => {
          console.error("Error:", error);
        });
    }
  };

  return (
    <div>
      <h1>Simple Storage</h1>
      <p>Account: {account}</p>
      <p>Storage Value: {storageValue}</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={newValue} 
          onChange={handleInputChange} 
          placeholder="Enter new value" 
        />
        <button type="submit">Set Value</button>
      </form>
    </div>
  );
};

export default App;