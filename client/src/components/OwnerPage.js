import React, { Component } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Input, Row, Col, Space, message } from 'antd';
import { Grid } from "@material-ui/core";
import 'antd/dist/antd.css';

class OwnerPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contractBalance: 0,
      amountToLoad: 0,
      productToAdd: "",
      ModalText: 'Content of the modal',
      visible: false,
      confirmLoading: false,
      isInsuranceLoading: false,
      isProductLoading: false,
      isRedeemLoading: false,
      isDepositLoading: false
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.setState({
      ModalText: 'The modal will be closed after two seconds',
      confirmLoading: true,
    });
    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
    }, 2000);
  };

  getContractBalance = () => {
    const { contract, web3 } = this.props;
    contract.methods.getBalance().call().then(resp => {
      this.setState({ contractBalance: parseFloat(web3.utils.fromWei(resp, "ether")) });
    })
  }

  componentDidMount() {
    this.getContractBalance();
    this.updateData();
  }

  addFunds = () => {
    const { account, contract } = this.props;
    if (this.state.amountToLoad === 0) {
      message.error("Invalid Amount");
      return;
    }
    this.setState({ isDepositLoading: true });
    var amount = this.props.web3.utils.toWei(this.state.amountToLoad, 'ether')
    contract.methods.addFunds().send({ from: account, value: amount }).then(resp => {
      this.getContractBalance();
      this.props.updateBalance();
      this.setState({ isDepositLoading: false, amountToLoad: 0 });
      message.success("Transaction Successful");
    })
      .catch(err => {
        this.setState({ isDepositLoading: false, amountToLoad: 0 });
        message.error(err.message);
      })
  }

  getInsuranceColumns = () => {
    return [
      {
        title: 'Index',
        dataIndex: 'key',
        width: 40
      },
      {
        title: 'Name',
        dataIndex: 'name',
        width: 150
      }
    ]
  }

  addProduct = async () => {
    if (this.state.productToAdd === "") {
      message.error("Product Name cannot be Empty")
      return;
    }
    const { account, contract } = this.props;
    this.setState({ isProductLoading: true });
    contract.methods.addProduct(this.state.productToAdd).send({ from: account }).then(resp => {
      this.setState({ productToAdd: "" });
      this.updateData();
      this.props.updateBalance();
      this.setState({ isProductLoading: false });
      message.success("Transaction Successful");
    })
      .catch(err => {
        message.error(err.message);
        this.setState({ isProductLoading: false });
      })
  }

  updateData = async () => {

    this.setState({ isInsuranceLoading: true })
    const products = await this.props.contract.methods.getProducts().call({ from: this.props.account });

    var insurance = products.map((product, index) => {
      return {
        key: index + 1,
        name: product.name
      };
    });
    this.setState({ insurance, isInsuranceLoading: false });
  }

  transferToOwner = () => {
    const { account, contract } = this.props;
    this.setState({ isRedeemLoading: true });
    contract.methods.transferToOwner().send({ from: account }).then(resp => {
      this.getContractBalance();
      this.props.updateBalance();
      message.success("Transaction Successful");
      this.setState({ isRedeemLoading: false });
    })
      .catch(err => {
        this.setState({ isRedeemLoading: false });
        message.error(err.message);
      })
  }

  render() {
    const { visible, confirmLoading, ModalText } = this.state;
    return (
      <div style={{ flexGrow: 1, marginTop: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: 300 }}><ArrowLeftOutlined onClick={this.props.onBack} style={{ fontSize: 32, marginLeft: 15, marginTop: 10 }} /></div>
          <div style={{ width: 300 }}><div style={{ padding: "10px 10px 0px 50px" }}><b>Balance: </b>{this.props.balance} ETH</div></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex" }}>
            <div style={{ marginLeft: 10, marginRight: 10, flexGrow: 1, marginTop: 10 }}>
              <Table
                title={() => 'Product Catalog'}
                dataSource={this.state.insurance}
                columns={this.getInsuranceColumns()}
                loading={this.state.isInsuranceLoading}
                pagination={false}
                bordered
                scroll={{ y: 300 }}
                style={{minHeight: 360}}
              />
              <div style={{display: "flex", marginTop: 20, justifyContent: "center"}}>
                <Input
                  onChange={(event) => this.setState({ productToAdd: event.target.value })}
                  value={this.state.productToAdd}
                  style={{marginLeft: 20, marginRight: 20, width: 400 }}
                />
                <Button loading={this.state.isProductLoading} type="primary" onClick={this.addProduct} style={{marginRight: 20}}>Add Product</Button>
              </div>
            </div>
            <div style={{ marginLeft: 10, marginRight: 10, flexGrow: 1, minWidth: 300, marginTop: 10  }}>
              <div style={{display: "flex", flexDirection: "column"}}>
                <Grid item style={{ textAlign: "center", backgroundColor: "#096dd9", color: "white", padding: 20 }}>
                  <h2 style={{ fontSize: "35px", lineHeight: 0.1, color: "#ffffff", marginTop: 15 }}>{Number(this.props.balance).toFixed(3)} <span style={{ fontSize: "15px" }}>ETH</span></h2>
                  <p style={{ color: "#fcfcfc" }}>Account Balance </p>
                  <Space size={2}>
                    <Col>
                      <Input
                        type="number"
                        addonAfter="ETH"
                        onChange={(event) => this.setState({ amountToLoad: event.target.value })}
                        value={this.state.amountToLoad}
                        style={{width: 140}}
                      />
                    </Col>
                    <Col>
                      <Button loading={this.state.isDepositLoading} type="primary" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", marginLeft: 10 }} onClick={this.addFunds}>Deposit</Button>
                    </Col>
                  </Space>
                  <p style={{ color: "#dddddd", marginBottom: 0 }}>Money will be transferred from <b>Your account</b> to <b>Contract</b></p>
                </Grid>
                <Grid item style={{ textAlign: "center", backgroundColor: "#096dd9", padding: 20, marginTop: 20 }}>
                  <h2 style={{ fontSize: "35px", lineHeight: 0.1, color: "#ffffff", marginTop: 15 }}>{this.state.contractBalance.toFixed(3)} <span style={{ fontSize: "15px" }}>ETH</span></h2>
                  <p style={{ color: "#fcfcfc" }}>Contract Balance</p>
                  <Button loading={this.state.isRedeemLoading} type="primary" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} onClick={this.transferToOwner}>Redeem</Button>
                  <p style={{ color: "#dddddd", marginBottom: 0 }}>Money will be transferred from <b>Contract</b> to <b>Your account</b></p>
                </Grid>
              </div>
            </div>
          </div>
        </div>
        <Modal
          title="Title"
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
        >
          <p>{ModalText}</p>
        </Modal>
      </div>
    )
  }
}

export default OwnerPage;