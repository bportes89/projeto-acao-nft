import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import AcaoNFTABI from './AcaoNFTABI.json';
import './App.css';

const contractAddress = "0xC3Ba5050Ec45990f76474163c5bA673c244aaECA";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [mintPrice, setMintPrice] = useState('');
  const [buyTokenId, setBuyTokenId] = useState('');
  const [sellTokenId, setSellTokenId] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const provider = await detectEthereumProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          const ethersProvider = new ethers.providers.Web3Provider(provider);
          const signer = ethersProvider.getSigner();
          const acaoNFTContract = new ethers.Contract(contractAddress, AcaoNFTABI, signer);
          setContract(acaoNFTContract);
          console.log("Contrato inicializado:", acaoNFTContract.address);
          await loadNFTs(acaoNFTContract);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      }
    };
    init();
  }, []);

  const loadNFTs = async (contract) => {
    try {
      const nftsForSale = await contract.getNFTsForSale();
      setNfts(nftsForSale.map(id => ({ id: id.toString(), price: ethers.utils.formatEther(id) })));
    } catch (error) {
      console.error("Erro ao carregar NFTs:", error);
      setNfts([]);
    }
  };

  const handleMint = async () => {
    if (!contract) return;
    try {
      const tx = await contract.mintNFT(account, ethers.utils.parseEther(mintPrice));
      await tx.wait();
      loadNFTs(contract);
    } catch (error) {
      console.error("Erro ao mintar NFT:", error);
    }
  };

  const handleBuy = async () => {
    if (!contract) return;
    try {
      const nft = nfts.find(n => n.id === buyTokenId);
      const tx = await contract.buyNFT(buyTokenId, { value: ethers.utils.parseEther(nft.price) });
      await tx.wait();
      loadNFTs(contract);
    } catch (error) {
      console.error("Erro ao comprar NFT:", error);
    }
  };

  const handleSell = async () => {
    if (!contract) return;
    try {
      const tx = await contract.listNFTForSale(sellTokenId, ethers.utils.parseEther(sellPrice));
      await tx.wait();
      loadNFTs(contract);
    } catch (error) {
      console.error("Erro ao listar NFT para venda:", error);
    }
  };

  return (
    <div className="App">
      <h1>AcaoNFT Marketplace</h1>
      <p>Conta conectada: {account}</p>
      
      <div>
        <h2>Mintar NFT</h2>
        <input type="text" value={mintPrice} onChange={(e) => setMintPrice(e.target.value)} placeholder="Preço em ETH" />
        <button onClick={handleMint}>Mintar</button>
      </div>

      <div>
        <h2>Comprar NFT</h2>
        <input type="text" value={buyTokenId} onChange={(e) => setBuyTokenId(e.target.value)} placeholder="ID do Token" />
        <button onClick={handleBuy}>Comprar</button>
      </div>

      <div>
        <h2>Vender NFT</h2>
        <input type="text" value={sellTokenId} onChange={(e) => setSellTokenId(e.target.value)} placeholder="ID do Token" />
        <input type="text" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="Preço em ETH" />
        <button onClick={handleSell}>Vender</button>
      </div>

      <div>
        <h2>NFTs à venda</h2>
        <ul>
          {nfts.map(nft => (
            <li key={nft.id}>ID: {nft.id} - Preço: {nft.price} ETH</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
