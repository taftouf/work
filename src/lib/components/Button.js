import React from "react";
import ReactDOM from "react-dom";
import "bulma/css/bulma.css";
import "./Button.css";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";

class Button extends React.Component {
  state={
    signer : null,
    isModalConnect: false,
    isModalPay: false
  };

  

  handleConnect = () => {
    this.setState({ isModalConnect: !this.state.isModalConnect });
  };


  handlePay = () => {
    this.setState({ isModalPay: !this.state.isModalPay });
  };

  metamask = async() => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      this.state.signer = provider.getSigner();
      this.handleConnect();
      this.handlePay();
    } catch (error) {
        if (error.code) {
          this.state.signer = null;
          
        } else {
          this.state.signer = null;
        }
    }
  }

  walletConnect = async() => {
    const provider = new WalletConnectProvider({
      infuraId: "a20f1d0ef34d4f5c84a1d8cead42c105",
    });
    try {
        await provider.enable();
        const web3Provider = new providers.Web3Provider(provider);
        this.state.signer = web3Provider.getSigner();
        this.handleConnect();
        this.handlePay();
    } catch (error) {
      this.state.signer = null;
    }

  }

  render() {
    const modalConnect = this.state.isModalConnect ? "is-active" : "";
    const modalPay = this.state.isModalPay ? "is-active" : "";

    return (
      <div className="App">
       
        {/* Modal Connect */}
        <div className={`modal ${modalConnect}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Connect Wallet</p>
              <button
                onClick={this.handleConnect}
                className="delete"
                aria-label="close"
              />
            </header>
            <section className="modal-card-body">
              <div className="field">
                <div className="control">
                  <button 
                    onClick={this.metamask} 
                    className="button is-medium is-fullwidth is-justify-content-flex-start">
                    Metamask
                  </button>
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <button 
                    onClick={this.walletConnect} 
                    className="button is-medium is-fullwidth is-justify-content-flex-start">
                    WalletConnect
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Modal Pay */}
        <div className={`modal ${modalPay}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Pay With Crypto</p>
              <button
                onClick={this.handlePay}
                className="delete"
                aria-label="close"
              />
            </header>
            <section className="modal-card-body">
              <div className="field">
                <div className="control">
                  <button 
                    onClick={()=>console.log("ETH")} 
                    className="button is-medium is-fullwidth is-justify-content-flex-start">
                    ETH
                  </button>
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <button 
                    onClick={()=>console.log("Link")} 
                    className="button is-medium is-fullwidth is-justify-content-flex-start">
                    Link
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Entry Button */}
        <button 
          onClick={this.handleConnect} 
          className="button is-medium is-fullwidth">
          Pay With Crypto
        </button>
      </div>
    );
  }
}

export default Button;
