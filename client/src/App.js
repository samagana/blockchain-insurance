import React, { Component } from "react";
import InsuranceContract from "./contracts/Insurance.json";
import getWeb3 from "./getWeb3";
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import OwnerPage from "./components/OwnerPage";
import PolicePage from "./components/PolicePage";
import UserPage from "./components/UserPage";
import BlockExplorer from "./components/BlockExplorer";

import "./App.css";
import "antd/dist/antd.css"

const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

class App extends Component {
  state = { balance: 0, web3: null, account: null, contract: null ,loggedIn: false , type: ""};

  login = async () =>{
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = InsuranceContract.networks[networkId];
      const instance = new web3.eth.Contract(
        InsuranceContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.setState({ web3, account:accounts[0], contract: instance },this.updateBalance);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
    }
  }

  getUserType=()=>{
    const {contract,account} = this.state;
    contract.methods.checkUser().call({from: account}).then(resp=>{
      this.setState({type:resp});
    })
  }

  componentDidMount= async() =>{
    this.login();
  }

  updateBalance = () => {
    const {web3,account} = this.state;
    web3.eth.getBalance(account, (err, balance) => {
      this.setState({balance:web3.utils.fromWei(balance, "ether")});
    });
  };

  backHome = () => {
    this.setState({ type: null });
  }

  getContent =()=>{
    switch(this.state.type){
      case "owner":
        return <OwnerPage />
      case "police":
        return <PolicePage />
      case "user":
        return <UserPage onBack={this.backHome} account={this.state.account} contract={this.state.contract} balance={this.state.balance} web3={this.state.web3} updateBalance={this.updateBalance}/>
      default:
        return (
          <div className="App-header">
            <h1>Welcome to <b style={{color:"#7cb305"}}>In-Sol-Ution</b></h1>
            <p>An insurance system built with the technology of <b>blockchain</b></p>
            <h2>We use <b style={{color:"#faad14"}}>Metamask</b> as our Web3 provider</h2>
            <p>You can change the account whenever required and we will automatically update the same in our application</p>
            <div><b>User: </b><b style={{color:"#7cb305"}}>{this.state.account}</b><b>, Balance:  </b><b style={{color:"#7cb305"}}>{this.state.balance} ETH</b></div>
            <Button type="primary" onClick={this.getUserType} className={'continue-button'}>
              Continue
            </Button>
          </div>
        );
    }
  }

  render() {
    if(!this.state.web3){
      return(
        <div className="App-header Loading">
          <Spin indicator={antIcon} />
          <h2 style={{marginTop: 40}}>Loading web3, accounts, and contract ...</h2>
      </div>
      )
    }
      const ethereum = window.ethereum;
      if(ethereum){
        ethereum.on('accountsChanged',async (accounts)=>{
          this.setState({account:accounts[0]},this.updateBalance);
        })
      }
      return(
        <div style={{display: "flex", flexDirection: "column", height: "100vh"}}>
          {this.getContent()}
          <BlockExplorer web3={this.state.web3}/>
        </div>
      )
  }
}

export default App;
