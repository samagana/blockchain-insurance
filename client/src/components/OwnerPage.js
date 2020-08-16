import React, {Component} from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Input , Row , Col, Space } from 'antd';
import {Grid,TextField} from "@material-ui/core";
import 'antd/dist/antd.css'; 
import "./owner.css";

class OwnerPage extends Component {
    constructor(props){
        super(props);
        this.state={
            contractBalance:0,
            amountToLoad:0,
            productToAdd:"",
            ModalText: 'Content of the modal',
            visible: false,
            confirmLoading: false,
            isInsuranceLoading:false
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

    getContractBalance=()=>{
        const {contract,web3} = this.props;
        contract.methods.getBalance().call().then(resp=>{
            this.setState({contractBalance:parseFloat(web3.utils.fromWei(resp, "ether"))});
        })
    }

    componentDidMount(){
        this.getContractBalance();
        this.updateData();
    }

    addFunds=()=>{
        const {account,contract} = this.props;
        console.log(typeof(this.state.amountToLoad));
        var amount = this.props.web3.utils.toWei(this.state.amountToLoad,'ether')
        contract.methods.addFunds().send({from:account,value:amount}).then(resp=>{
            this.setState({amountToLoad:0})
            this.getContractBalance();
            this.props.updateBalance();
        })
        .catch(err=>{
            alert(err.message);
            this.setState({amountToLoad:0})
            console.log(err);
        })
    }

    getInsuranceColumns=()=>{
        return [
            {
                title: 'Index',
                dataIndex: 'key',
                width: 80
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150
            }
        ]
    }

    addProduct = async () =>{
        const {account,contract} = this.props;
        if(this.state.productToAdd!=="")
            contract.methods.addProduct(this.state.productToAdd).send({from:account}).then(resp=>{
                this.setState({productToAdd:""});
                this.updateData();
                this.props.updateBalance();
            })
    }

    updateData= async ()=>{

        this.setState({isInsuranceLoading:true})
        const products = await this.props.contract.methods.getProducts().call({from: this.props.account});

        var insurance = products.map((product, index) => {
            return {
                key: index + 1,
                name: product.name
            };
        });
        this.setState({ insurance, isInsuranceLoading: false });
    }

    render(){
        const { visible, confirmLoading, ModalText } = this.state;
        return(
            <div style={{flexGrow:1,flexShrink:1,minHeight:"100vh",overflow:"hidden"}}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <ArrowLeftOutlined onClick={this.props.onBack} style={{fontSize: 24, marginLeft: 10, marginTop: 10}}/>
                </div>
                <Space direction="vertical" size={10}>
                <div className="App-Body" style={{flexGrow:1}}>
                    <React.Fragment>
                            <Grid direction="row" container item justify="center" alignItems="center" spacing={10}>
                                <Grid item style={{textAlign:"center",backgroundColor:"#096dd9",color:"white"}}>
                                    <h2 style={{fontSize:"35px",lineHeight:0.1,color:"#ffffff"}}>{this.props.balance.toFixed(3)} <span style={{fontSize:"15px"}}>ETH</span></h2>
                                    <p style={{color:"#cccccc"}}>Account Balance </p>
                                </Grid>
                                <Grid item/>
                                <Grid item style={{textAlign:"center",backgroundColor:"#096dd9"}}>
                                    <h2 style={{fontSize:"35px",lineHeight:0.1,color:"#ffffff"}}>{this.state.contractBalance.toFixed(3)}</h2>
                                    <p style={{color:"#cccccc"}}>
                                    Contract Balance (in ETH)
                                    </p>
                                </Grid>
                            </Grid>
                    </React.Fragment>
                    <div style={{marginLeft: 10, marginRight: 10,marginTop:50}}>
                        <Table 
                            title={() => 'Product Catalog'}
                            dataSource={this.state.insurance}
                            columns={this.getInsuranceColumns()}
                            loading={this.state.isInsuranceLoading}
                            pagination={false}
                            bordered
                            scroll={{y: 280}}
                        />
                            <div className="App-Content" style={{flexGrow:1,display:"flex", alignItems:"center",marginTop:30,width:"100%"}}>
                                <Row>
                                    <Space size={50}>
                                    <Col>
                                        <Row>
                                            <Space size={10}>
                                                <Col>
                                                    <Input 
                                                        onChange={(event)=>this.setState({productToAdd:event.target.value})}
                                                        value={this.state.productToAdd}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Button type="primary" onClick={this.addProduct}>Add Product</Button>
                                                </Col>
                                            </Space>
                                        </Row>
                                    </Col>
                                    <Col>
                                        <Row>
                                            <Space size={10}> 
                                                <Col>
                                                    <Input 
                                                        type="number"
                                                        prefix="ETH" 
                                                        onChange={(event)=>this.setState({amountToLoad: event.target.value})}
                                                        value={this.state.amountToLoad}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Button style={{backgroundColor:"#0ad48b"}} onClick={this.addFunds}>Deposit Ether</Button>
                                                </Col>
                                            </Space>
                                        </Row>
                                    </Col>
                                    </Space>
                                </Row>
                            </div>
                    </div>
                </div>
                </Space>

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