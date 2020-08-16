import React, { Component } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Input, message } from 'antd';

class UserPage extends Component {
    index = -1;

    constructor(props){
        super(props);
        this.state = {
            insurance: [],
            claims: [],
            isInsuranceLoading: false,
            isClaimsLoading: false,
            claimDialog: false,
            payDialog: false,
            buyDialog: false,
            isLoading: false,
            value: ''
        }
    }

    componentDidMount = async () => {
        await this.updateData();
    }

    updateData = async () => {
        this.setState({ isClaimsLoading: true, isInsuranceLoading: true });
        const products = await this.props.contract.methods.getProducts().call({from: this.props.account});
        const myInsurances = await this.props.contract.methods.getMyInsurance().call({from: this.props.account});

        var insurance = products.map((product, index) => {
            return {
                key: index + 1,
                name: product.name,
                purchased: myInsurances[index].isPurchased,
                premium: this.props.web3.utils.fromWei(myInsurances[index].premium, 'ether'),
                amount: this.props.web3.utils.fromWei(myInsurances[index].amount, 'ether'),
                claimed: myInsurances[index].isClaimed
            };
        });
        this.setState({ insurance, isInsuranceLoading: false });

        const myClaims = (await this.props.contract.methods.getMyClaims().call({from: this.props.account})).filter((item) => item.claimedBy !== 0);
        var claims = myClaims.map((entry, index) => {
            return {
                key: index + 1,
                name: products[entry.productIndex].name,
                amount: entry.amount,
                approved: entry.isApproved,
                rejected: entry.isRejected,
                time: this.convertTimestamp(parseInt(entry.time))
            }
        });
        this.setState({ claims, isClaimsLoading: false });
    }

    render() {
        return (
            <div style={{flexGrow: 1, marginTop: 5}}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <div style={{width: 300}}><ArrowLeftOutlined onClick={this.props.onBack} style={{fontSize: 32, marginLeft: 15, marginTop: 10}}/></div>
                    <div style={{width: 300}}><h1 style={{textAlign: "center"}}>User View</h1></div>
                    <div style={{width: 300}}><div style={{padding: "10px 10px 0px 50px"}}><b>Balance: </b>{this.props.balance} ETH</div></div>
                </div>
                <div style={{textAlign:"center"}}>
                    <div style={{display: "flex"}}>
                        <div style={{marginLeft: 10, marginRight: 10, flexGrow: 1}}>
                            <Table 
                                title={() => 'Product Catalog'}
                                dataSource={this.state.insurance}
                                columns={this.getInsuranceColumns()}
                                loading={this.state.isInsuranceLoading}
                                pagination={false}
                                bordered
                                scroll={{y: 320}}
                            />
                        </div>
                        <div style={{marginLeft: 10, marginRight: 10, flexGrow: 1}}>
                            <Table 
                                title={() => 'My Claims'}
                                dataSource={this.state.claims}
                                columns={this.getClaimsColumns()}
                                loading={this.state.isClaimsLoading}
                                pagination={false}
                                bordered
                                scroll={{y: 320}}
                            />
                        </div>
                    </div>
                </div>
                { this.getModal() }
            </div>
        );
    }

    getInsuranceColumns = () => {
        return [
            {
                title: 'ID',
                dataIndex: 'key',
                width: 60
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150
            },
            {
                title: 'Status',
                dataIndex: 'purchased',
                key: 'status',
                render: (text, record, index) => {
                    if (!record.purchased) {
                        return (<Button 
                                    type='primary'
                                    onClick={() => {
                                        this.index = index;
                                        this.setState({ buyDialog: true, value: '' })
                                    }}
                                >
                                    Buy
                                </Button>);
                    }
                    return (
                        <div>
                            <div><b>Premium: </b>{`${record.premium} ETH`}</div>
                            <div><b>Aggregate amount: </b>{`${record.amount} ETH`}</div>
                            <div style={{marginTop: 5}}>
                                <Button
                                    style={{marginRight: 10}}
                                    onClick={() => {
                                        this.index = index;
                                        this.setState({ claimDialog: true, value: '' })
                                    }}
                                    disabled={record.claimed}
                                >Raise a claim</Button>
                                <Button
                                    type='primary'
                                    style={{backgroundColor: "#52c41a", borderColor: "#52c41a"}}
                                    onClick={() => {
                                        this.index = index;
                                        this.setState({ payDialog: true, value: '' })
                                    }}
                                >
                                    Pay premium
                                </Button>
                            </div>
                        </div>
                    )
                }
            },
        ];
    }

    getClaimsColumns = () => {
        return [
            {
                title: 'Claim ID',
                dataIndex: 'key',
                width: 80
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                width: 100,
                render: (text) => `${text} ETH`
            },
            {
                title: 'Status',
                dataIndex: 'approved',
                key: 'status',
                render: (text, record) => {
                    if (record.approved) {
                        return <div style={{color: "#7cb305"}}>Approved</div>
                    } else if (record.rejected) {
                        return <div style={{color: "#ff4d4f"}}>Rejected</div>
                    } else {
                        return <div style={{color: "#d4b106"}}>Pending</div>
                    }
                },
                width: 120
            },
            {
                title: 'Last updated',
                dataIndex: 'time',
                width: 150
            },
        ];
    }

    applyClaim = async () => {
        if (isNaN(this.state.value)) {
            message.error('Invalid amount');
            return;
        }
        this.setState({ isLoading: true });
        await this.props.contract.methods.claimInsurance(this.index, parseInt(this.state.value)).send({ from: this.props.account });
        this.setState({ isLoading: false, claimDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    payPremium = async () => {
        if (isNaN(this.state.value)) {
            message.error('Invalid amount');
            return;
        }
        if (parseFloat(this.state.value) < parseFloat(this.state.insurance[this.index].premium)) {
            message.error('Amount less than minimum payable');
            return;
        }
        this.setState({ isLoading: true });
        await this.props.contract.methods.payPremium(this.index).send({ from: this.props.account, value: this.props.web3.utils.toWei(this.state.value) });
        this.setState({ isLoading: false, payDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    buyInsurance = async () => {
        if (isNaN(this.state.value)) {
            message.error('Invalid amount');
            return;
        }
        this.setState({ isLoading: true });
        await this.props.contract.methods.buyInsurance(this.index, this.props.web3.utils.toWei(this.state.value)).send({ from: this.props.account });
        this.setState({ isLoading: false, buyDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    getModal = () => {
        return (
            <div>
                <Modal
                    title={'Apply for a claim'}
                    visible={this.state.claimDialog}
                    onOk={this.applyClaim}
                    onCancel={() => this.setState({ claimDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{marginTop: 3, flexGrow: 1, fontWeight: 700}}>Claim amount: </div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'ETH'}/></div>
                </Modal>
                <Modal
                    title={'Pay premium'}
                    visible={this.state.payDialog}
                    onOk={this.payPremium}
                    onCancel={() => this.setState({ payDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{flexGrow: 1, fontWeight: 700}}>Minimum payable: </div>{this.state.insurance[this.index] ? this.state.insurance[this.index].premium : null} ETH</div>
                    <div style={{display: "flex", marginTop: 4}}><div style={{marginTop: 3, flexGrow: 1, fontWeight: 700}}>Premium amount: </div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'ETH'}/></div>
                </Modal>
                <Modal
                    title={'Buy insurance'}
                    visible={this.state.buyDialog}
                    onOk={this.buyInsurance}
                    onCancel={() => this.setState({ buyDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{flexGrow: 1, fontWeight: 700}}>Product Name:</div>{this.state.insurance[this.index] ? this.state.insurance[this.index].name : null}</div>
                    <div style={{display: "flex", marginTop: 4}}><div style={{flexGrow: 1, fontWeight: 700}}>Product ID:</div>{this.index + 1}</div>
                    <div style={{display: "flex", marginTop: 4}}><div style={{marginTop: 3, flexGrow: 1, fontWeight: 700}}>Set premium:</div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'ETH'}/></div>
                </Modal>
            </div>
        );
    }

    convertTimestamp = (timestamp) => {
        var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),  // Months are zero based. Add leading 0.
            dd = ('0' + d.getDate()).slice(-2),         // Add leading 0.
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),     // Add leading 0.
            ampm = 'AM',
            time;
    
        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }
    
        // ie: 2014-03-24, 3:00 PM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
        return time;
    }
}

export default UserPage;