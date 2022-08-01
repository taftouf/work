import React from "react";
import "bulma/css/bulma.css";
import "./Button.css";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import axios from "axios";
import TrackClick from "./Track";


class Button extends React.Component {
  constructor(props) {
    super(props);
    this.buttonRef = React.createRef();
  }

  state={
    signer: null,
    isModalConnect: false,
    isModalPay: false,
    isModalLoading: false,
    isModalSuccess: false,
    isModalFailed: false,
    transactionHash: null,
    position: null,
    wallet: null,
    eventName: null,
    tokenIn: null,
    tokenOut:null,
    amountIn: null
  };

  handleConnect = (e) => {
    const rect = this.buttonRef.current.getBoundingClientRect()
    this.setState({ isModalConnect: !this.state.isModalConnect });
    this.setState({position : {'top':rect.top, 'right':rect.right, 'bottom':rect.bottom, 'left':rect.left}});
  };


  handlePay = () => {
    this.setState({ isModalPay: !this.state.isModalPay });
  };

  handleLoading = () => {
    this.setState({ isModalLoading : !this.state.isModalLoading });
  }

  handleSuccess = () => {
    this.setState({ isModalSuccess : !this.state.isModalSuccess });
  }

  handleFailed = () => {
    this.setState({ isModalFailed : !this.state.isModalFailed });
  }

  metamask = async() => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      this.state.signer = provider.getSigner();
      this.handleConnect();
      this.handlePay();
      this.setState({wallet : "metamask"});
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
        this.state({wallet : "walletConnect"});
    } catch (error) {
      this.state.signer = null;
    }
  }

  sendDataToDB = async () => {
    console.log(this.state.transactionHash);
    console.log(this.props.Apikey);
    console.log(this.state.signer);
    if(this.props.Apikey === undefined || this.props.Apikey === ""){
      console.log(this.props, -1);
      return -1;
    }else{
      axios({
      method: "post",
      url: "https://abierto-api.herokuapp.com/api/payments",
      data: {
        key: this.props.Apikey,
        transactionHash: this.state.transactionHash,
        tokenIn: this.state.tokenIn,
        tokenOut: this.state.tokenOut,
        amountIn: this.state.amountIn,
        wallet: this.state.wallet,
        position:this.state.position,
        eventName: this.state.eventName,
        protocol : window.location.protocol,
        host : window.location.host,
        pathname : window.location.pathname
      },
      headers: { 
        'Content-Type': 'application/json' ,
        'Accept': 'application/json'
       },
    })
      .then(function (response) {
        //handle success
        console.log(response);
      })
      .catch(function (response) {
        //handle error
        console.log(response);
      });
    }
  }

  listTokens = this.props.tokens.map((token, i) =>  
    <div key={i} className="field">
      <div className="control">
      <button 
        onClick={()=>this._payWithToken(this.props.receiver, token.address, token.amount, token.decimal, token.symbol)} 
        className="button is-medium is-fullwidth is-fullwidth">
              <span className="column is-6 has-text-left">{token.symbol}</span>
              <span className="column is-6 has-text-right">{token.amount}</span>
      </button>
      </div>
    </div>
  ); 

  // Pay with ETH
  async _payWithEth (amount, receiver){
    if(amount !== undefined && receiver !== undefined){
      this.handlePay();
      this.handleLoading();
      try {
          if(this.state.signer == null){
            console.log("Connect Your Wallet");return;
          }
          let abi = ["function PayWithETH(address _to)external payable"]
          let contract = new ethers.Contract("0x82703A9F3618Dce7CE840f45704eD0160066A3B4", abi, this.state.signer);
          let overrides = {
              value: ethers.utils.parseUnits(amount,"ether"),
          };
          let tx = await contract.PayWithETH(receiver, overrides);
          let res = await tx.wait();
          
          if(res.status === 1){
            this.handleLoading();
            if (this.props.succesModal) {
              this.handleSuccess();
            }
            this.props.setResponse(res);
            this.setState({ transactionHash: res.transactionHash });
          }else{
            this.handleLoading();
            if (this.props.succesModal) {
              this.handleFailed();
            }
            this.props.setResponse(tx);
            this.setState({ transactionHash: tx });
          }
      } catch (error) {
          if(error.code === undefined){
            this.handleLoading();
            if (this.props.succesModal) {
              this.handleFailed();
            }
            this.props.setResponse(-1);
            this.setState({ transactionHash: -1 });
          }else{
            this.handleLoading();
            if (this.props.succesModal) {
              this.handleFailed();
            }
            this.props.setResponse(error.code);
            this.setState({ transactionHash: error.code });
          }
      }
    }else{
      this.handleLoading();
      if (this.props.succesModal) {
        this.handleFailed();
      }
      this.props.setResponse(-1);
      this.setState({ transactionHash: -1 });
    }
    this.setState({amountIn: amount});
    this.setState({tokenIn : 'Eth'});
    this.setState({tokenOut : 'Eth'});
    this.sendDataToDB();
  }

  // Pay With Tokens
  async _payWithToken(_to, _token, amount, _decimal, _tokenIn){
    if(amount !== undefined && _to !== undefined && _token !== undefined && _decimal!==undefined){
        this.handlePay();
        this.handleLoading();
        var _amount = "";
        if(_decimal === String(18)){
          _amount = ethers.utils.parseEther(amount);
        }else{
            _amount = String(parseInt(amount,10) * 10 ** parseInt(_decimal,10));
        }
        try {
            if(this.state.signer == null){
              console.log("Connect Your Wallet");return;
            }
            let abi1 = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
            let contract_ERC20 = new ethers.Contract(_token.toString(), abi1, this.state.signer);
            let tx = await contract_ERC20.approve("0x82703A9F3618Dce7CE840f45704eD0160066A3B4", String(_amount));
            let res = await tx.wait();
            let overrides = {
                gasLimit: 750000,
            };
            let abi2 = ["function SwapTokenForETH(uint tokenAmount, address token, address to) external"];
            let contract = new ethers.Contract("0x82703A9F3618Dce7CE840f45704eD0160066A3B4",abi2,this.state.signer);
            tx = await contract.SwapTokenForETH(String(_amount),_token.toString(), _to.toString(), overrides);
            res = await tx.wait();
            if(res.status === 1){
              this.handleLoading();
              if (this.props.succesModal) {
                this.handleSuccess();
              }
              this.props.setResponse(res);
              this.setState({ transactionHash: res.transactionHash });
            }else{
              this.handleLoading();
              if (this.props.succesModal) {
                this.handleFailed();
              }
              this.props.setResponse(tx);
              this.setState({ transactionHash: tx });
            }
        } catch (error) {
            if(error.code === undefined){
              this.handleLoading();
              if (this.props.succesModal) {
                this.handleFailed();
              }
              this.props.setResponse(-1);
              this.setState({ transactionHash: -1 });
            }else{
              this.handleLoading();
              if (this.props.succesModal) {
                this.handleFailed();
              }
              this.props.setResponse(error.code);
              this.setState({ transactionHash: error.code });
            }
        }
    }else{
      this.handleLoading();
      if (this.props.succesModal) {
        this.handleFailed();
      }
      this.props.setResponse(-1);
      this.setState({ transactionHash: -1 });
    }
    this.setState({amountIn: amount});
    this.setState({tokenIn : _tokenIn});
    this.setState({tokenOut : 'Eth'});
    this.sendDataToDB();
  }

  // traking

  render() {
    const modalConnect = this.state.isModalConnect ? "is-active" : "";
    const modalPay = this.state.isModalPay ? "is-active" : "";
    const modalLoading = this.state.isModalLoading ? "is-active" : "";
    const modalSuccess = this.state.isModalSuccess ? "is-active" : "";
    const modalFailed = this.state.isModalFailed ? "is-active" : "";

    return (
      <div>
       
        {/* Modal Connect */}
        <div className={`modal ${modalConnect}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <header className="modal-card-head ">
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
                    <figure className="image is-24x24 mr-4">
                      <svg viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.0728 0L21.9092 12.6999L25.1009 5.21543L39.0728 0Z" fill="#E17726"/><path d="M0.966797 0.0151367L14.9013 5.21656L17.932 12.7992L0.966797 0.0151367Z" fill="#E27625"/><path d="M32.1656 27.0093L39.7516 27.1537L37.1004 36.1603L27.8438 33.6116L32.1656 27.0093Z" fill="#E27625"/><path d="M7.83409 27.0093L12.1399 33.6116L2.89876 36.1604L0.263672 27.1537L7.83409 27.0093Z" fill="#E27625"/><path d="M17.5203 10.8677L17.8304 20.8807L8.55371 20.4587L11.1924 16.4778L11.2258 16.4394L17.5203 10.8677Z" fill="#E27625"/><path d="M22.3831 10.7559L28.7737 16.4397L28.8067 16.4778L31.4455 20.4586L22.1709 20.8806L22.3831 10.7559Z" fill="#E27625"/><path d="M12.4115 27.0381L17.4768 30.9848L11.5928 33.8257L12.4115 27.0381Z" fill="#E27625"/><path d="M27.5893 27.0376L28.391 33.8258L22.5234 30.9847L27.5893 27.0376Z" fill="#E27625"/><path d="M22.6523 30.6128L28.6066 33.4959L23.0679 36.1282L23.1255 34.3884L22.6523 30.6128Z" fill="#D5BFB2"/><path d="M17.3458 30.6143L16.8913 34.3601L16.9286 36.1263L11.377 33.4961L17.3458 30.6143Z" fill="#D5BFB2"/><path d="M15.6263 22.1875L17.1822 25.4575L11.8848 23.9057L15.6263 22.1875Z" fill="#233447"/><path d="M24.3739 22.1875L28.133 23.9053L22.8184 25.4567L24.3739 22.1875Z" fill="#233447"/><path d="M12.8169 27.0049L11.9606 34.0423L7.37109 27.1587L12.8169 27.0049Z" fill="#CC6228"/><path d="M27.1836 27.0049L32.6296 27.1587L28.0228 34.0425L27.1836 27.0049Z" fill="#CC6228"/><path d="M31.5799 20.0605L27.6165 24.0998L24.5608 22.7034L23.0978 25.779L22.1387 20.4901L31.5799 20.0605Z" fill="#CC6228"/><path d="M8.41797 20.0605L17.8608 20.4902L16.9017 25.779L15.4384 22.7038L12.3988 24.0999L8.41797 20.0605Z" fill="#CC6228"/><path d="M8.15039 19.2314L12.6345 23.7816L12.7899 28.2736L8.15039 19.2314Z" fill="#E27525"/><path d="M31.8538 19.2236L27.2061 28.2819L27.381 23.7819L31.8538 19.2236Z" fill="#E27525"/><path d="M17.6412 19.5088L17.8217 20.6447L18.2676 23.4745L17.9809 32.166L16.6254 25.1841L16.625 25.1119L17.6412 19.5088Z" fill="#E27525"/><path d="M22.3562 19.4932L23.3751 25.1119L23.3747 25.1841L22.0158 32.1835L21.962 30.4328L21.75 23.4231L22.3562 19.4932Z" fill="#E27525"/><path d="M27.7797 23.6011L27.628 27.5039L22.8977 31.1894L21.9414 30.5138L23.0133 24.9926L27.7797 23.6011Z" fill="#F5841F"/><path d="M12.2373 23.6011L16.9873 24.9926L18.0591 30.5137L17.1029 31.1893L12.3723 27.5035L12.2373 23.6011Z" fill="#F5841F"/><path d="M10.4717 32.6338L16.5236 35.5013L16.4979 34.2768L17.0043 33.8323H22.994L23.5187 34.2753L23.48 35.4989L29.4935 32.641L26.5673 35.0591L23.0289 37.4894H16.9558L13.4197 35.0492L10.4717 32.6338Z" fill="#C0AC9D"/><path d="M22.2191 30.231L23.0748 30.8354L23.5763 34.8361L22.8506 34.2234H17.1513L16.4395 34.8485L16.9244 30.8357L17.7804 30.231H22.2191Z" fill="#161616"/><path d="M37.9395 0.351562L39.9998 6.53242L38.7131 12.7819L39.6293 13.4887L38.3895 14.4346L39.3213 15.1542L38.0875 16.2779L38.8449 16.8264L36.8347 19.1742L28.5894 16.7735L28.5179 16.7352L22.5762 11.723L37.9395 0.351562Z" fill="#763E1A"/><path d="M2.06031 0.351562L17.4237 11.723L11.4819 16.7352L11.4105 16.7735L3.16512 19.1742L1.15488 16.8264L1.91176 16.2783L0.678517 15.1542L1.60852 14.4354L0.350209 13.4868L1.30098 12.7795L0 6.53265L2.06031 0.351562Z" fill="#763E1A"/><path d="M28.1861 16.2485L36.9226 18.7921L39.7609 27.5398L32.2728 27.5398L27.1133 27.6049L30.8655 20.2912L28.1861 16.2485Z" fill="#F5841F"/><path d="M11.8139 16.2485L9.13399 20.2912L12.8867 27.6049L7.72971 27.5398H0.254883L3.07728 18.7922L11.8139 16.2485Z" fill="#F5841F"/><path d="M25.5283 5.17383L23.0847 11.7736L22.5661 20.6894L22.3677 23.4839L22.352 30.6225H17.6471L17.6318 23.4973L17.4327 20.6869L16.9139 11.7736L14.4707 5.17383H25.5283Z" fill="#F5841F"/></svg>
                    </figure>
                    Metamask
                  </button>
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <button 
                    onClick={this.walletConnect} 
                    className="button is-medium is-fullwidth is-justify-content-flex-start">
                    <figure className="image is-24x24 mr-4">
                      <svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><defs><radialGradient cx="0%" cy="50%" fx="0%" fy="50%" r="100%" id="radialGradient-1"><stop stopColor="#5D9DF6" offset="0%"></stop><stop stopColor="#006FFF" offset="100%"></stop></radialGradient></defs><g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><g id="logo"><rect id="base" fill="url(#radialGradient-1)" x="0" y="0" width="512" height="512" rx="256"></rect><path d="M169.209772,184.531136 C217.142772,137.600733 294.857519,137.600733 342.790517,184.531136 L348.559331,190.179285 C350.955981,192.525805 350.955981,196.330266 348.559331,198.676787 L328.82537,217.99798 C327.627045,219.171241 325.684176,219.171241 324.485851,217.99798 L316.547278,210.225455 C283.10802,177.485633 228.89227,177.485633 195.453011,210.225455 L186.951456,218.549188 C185.75313,219.722448 183.810261,219.722448 182.611937,218.549188 L162.877976,199.227995 C160.481326,196.881474 160.481326,193.077013 162.877976,190.730493 L169.209772,184.531136 Z M383.602212,224.489406 L401.165475,241.685365 C403.562113,244.031874 403.562127,247.836312 401.165506,250.182837 L321.971538,327.721548 C319.574905,330.068086 315.689168,330.068112 313.292501,327.721609 C313.292491,327.721599 313.29248,327.721588 313.29247,327.721578 L257.08541,272.690097 C256.486248,272.103467 255.514813,272.103467 254.915651,272.690097 C254.915647,272.690101 254.915644,272.690105 254.91564,272.690108 L198.709777,327.721548 C196.313151,330.068092 192.427413,330.068131 190.030739,327.721634 C190.030725,327.72162 190.03071,327.721606 190.030695,327.721591 L110.834524,250.181849 C108.437875,247.835329 108.437875,244.030868 110.834524,241.684348 L128.397819,224.488418 C130.794468,222.141898 134.680206,222.141898 137.076856,224.488418 L193.284734,279.520668 C193.883897,280.107298 194.85533,280.107298 195.454493,279.520668 C195.454502,279.520659 195.45451,279.520651 195.454519,279.520644 L251.65958,224.488418 C254.056175,222.141844 257.941913,222.141756 260.338618,224.488222 C260.338651,224.488255 260.338684,224.488288 260.338717,224.488321 L316.546521,279.520644 C317.145683,280.107273 318.117118,280.107273 318.71628,279.520644 L374.923175,224.489406 C377.319825,222.142885 381.205562,222.142885 383.602212,224.489406 Z" id="WalletConnect" fill="#FFFFFF" fillRule="nonzero"></path></g></g></svg>
                    </figure>
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
                    onClick={()=>this._payWithEth(this.props.amount, this.props.receiver)} 
                    className="button is-medium is-fullwidth is-fullwidth">
                          <span className="column is-6 has-text-left">{this.props.symbol}</span>
                          <span className="column is-6 has-text-right">{this.props.amount}</span>
                  </button>
                </div>
              </div>
              {this.listTokens}
            </section>
          </div>
        </div>

        {/* Modal Loading */}
        <div className={`modal ${modalLoading}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title"> Please wait your payment is being processed </p>
            </header>
            <section className="modal-card-body">
              <div className="field">
                <div className="control">
                  <div className="columns is-mobile">
                    <div className="column is-half is-offset-one-quarter has-text-centered">
                      <div className="load">
                        <div className="lds-dual-ring"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Modal Success */}
        <div className={`modal ${modalSuccess}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <article className="message is-success">
              <div className="message-header">
                <p className="modal-card-title"> Succes </p>
                <button
                  onClick={this.handleSuccess}
                  className="delete"
                  aria-label="close"
                />
              </div>
              <div className="message-body">
                <div className="field">
                  <div className="control">
                    <div className="columns is-mobile">
                      <div className="column has-text-centered">
                        <p className="block my-5"> Your Payment Has Been Successfully Processed</p>                                </div>
                    </div>
                  </div>
                </div>              
              </div>
            </article>
          </div>
        </div>

        {/* Modal Failed */}
        <div className={`modal ${modalFailed}`}>
          <div className="modal-background" />
          <div className="modal-card">
            <article className="message is-danger">
              <div className="message-header">
                <p className="modal-card-title"> Transaction Failed </p>
                <button
                  onClick={this.handleFailed}
                  className="delete"
                  aria-label="close"
                />
              </div>
              <div className="message-body">
                <div className="field">
                  <div className="control">
                    <div className="columns is-mobile">
                      <div className="column has-text-centered">
                        <p className="block my-5">
                          Your payment has been declined <br />
                          Please check your details and try again or contact support
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Entry Button */}
          <button 
              ref={this.buttonRef}
              onClick={(e)=>{this.handleConnect(); this.setState({eventName : e.type})}} 
              className="button is-medium is-fullwidth">
                {this.props.label}
          </button>          
      </div>
    );
  }
}

export default Button;
