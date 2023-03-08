import { useEffect, useState } from "react";
import { ethers } from "ethers";

import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

import RealEstate from "./abis/RealEstate.json";
import Escrow from "./abis/Escrow.json";

import config from "./config.json";

const ethereum = window.ethereum;

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();

    const realEstate = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate.abi,
      provider
    );
    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    for (let i = 1; i <= totalSupply, i++; ) {
      const uri = await realEstate.tokenURI(i);
    }

    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow.abi,
      provider
    );
    setEscrow(escrow);
    // config[network.chainId].escrow.address;

    console.log(escrow, 123);

    ethereum.on("accountsChanged", async () => {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className="cards__section">
        <h3>Homes for you</h3>
        <hr />
        <div className="cards">
          <div className="card">
            <div className="card__image">
              <img src="" alt="Home" />
            </div>
            <div className="card__info">
              <h4>1 ETH</h4>
              <p>
                <strong>1</strong> beds |<strong>2</strong> bath |
                <strong>3</strong> sqft
              </p>
              <p>1234 Elm st</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
