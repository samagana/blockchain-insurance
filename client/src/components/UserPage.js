import React, { Component } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Input } from 'antd';

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
        console.log(myClaims);
        var claims = myClaims.map((entry, index) => {
            return {
                key: index + 1,
                name: products[entry.productIndex].name,
                approved: entry.isApproved,
                rejected: entry.isRejected,
                time: this.convertTimestamp(parseInt(entry.time))
            }
        });
        this.setState({ claims, isClaimsLoading: false });
    }

    render() {
        return (
            <div style={{flexGrow: 1}}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <ArrowLeftOutlined onClick={this.props.onBack} style={{fontSize: 24, marginLeft: 10, marginTop: 10}}/>
                    <span style={{marginRight: 10, marginTop: 10}}><b>Balance: </b>{this.props.balance} eth</span>
                </div>
                <div style={{textAlign:"center"}}>
                    <h1>User Page</h1>
                    <div style={{display: "flex"}}>
                        <div style={{marginLeft: 10, marginRight: 10, flexGrow: 1}}>
                            <Table 
                                title={() => 'Product Catalog'}
                                dataSource={this.state.insurance}
                                columns={this.getInsuranceColumns()}
                                loading={this.state.isInsuranceLoading}
                                pagination={false}
                                bordered
                                scroll={{y: 280}}
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
                                scroll={{y: 280}}
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
                title: 'Index',
                dataIndex: 'key',
                width: 80
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
                            <div><b>Premium: </b>{`${record.premium} eth`}</div>
                            <div><b>Aggregate amount: </b>{`${record.amount} eth`}</div>
                            <div style={{marginTop: 5}}>
                                { !record.claimed && (
                                    <Button
                                        style={{marginRight: 10}}
                                        onClick={() => {
                                            this.index = index;
                                            this.setState({ claimDialog: true, value: '' })
                                        }}
                                    >Claim</Button> 
                                )}
                                <Button
                                    type='primary'
                                    style={{backgroundColor: "#52c41a"}}
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
                title: 'Index',
                dataIndex: 'key',
                width: 80
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150
            },
            {
                title: 'Status',
                dataIndex: 'approved',
                key: 'status',
                render: (text, record) => {
                    if (record.approved) {
                        return <div>Approved</div>
                    } else if (record.rejected) {
                        return <div>Rejected</div>
                    } else {
                        return <div>Pending</div>
                    }
                }
            },
            {
                title: 'Last updated',
                dataIndex: 'time',
                width: 150
            },
        ];
    }

    applyClaim = async () => {
        this.setState({ isLoading: true });
        await this.props.contract.methods.claimInsurance(this.index, parseInt(this.state.value)).send({ from: this.props.account });
        this.setState({ isLoading: false, claimDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    payPremium = async () => {
        this.setState({ isLoading: true });
        await this.props.contract.methods.payPremium(this.index).send({ from: this.props.account, value: this.props.web3.utils.toWei(this.state.value) });
        this.setState({ isLoading: false, payDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    buyInsurance = async () => {
        this.setState({ isLoading: true });
        await this.props.contract.methods.buyInsurance(this.index, this.props.web3.utils.toWei(this.state.value)).send({ from: this.props.account });
        this.setState({ isLoading: false, buyDialog: false });
        this.updateData();
        this.props.updateBalance();
    }

    getModal = () => {
        if (this.state.claimDialog) {
            return (
                <Modal
                    title={'Apply for a claim'}
                    visible={true}
                    onOk={this.applyClaim}
                    onCancel={() => this.setState({ claimDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{marginTop: 3, flexGrow: 1}}>Claim amount: </div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'eth'}/></div>
                </Modal>
            )
        } else if (this.state.payDialog) {
            return (
                <Modal
                    title={'Pay premium'}
                    visible={true}
                    onOk={this.payPremium}
                    onCancel={() => this.setState({ payDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{flexGrow: 1, fontWeight: 700}}>Minimum payable: </div>{this.state.insurance[this.index].premium} eth</div>
                    <div style={{display: "flex"}}><div style={{marginTop: 3, flexGrow: 1, fontWeight: 700}}>Claim amount: </div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'eth'}/></div>
                </Modal>
            )
        } else if (this.state.buyDialog) {
            return (
                <Modal
                    title={'Buy insurance'}
                    visible={true}
                    onOk={this.buyInsurance}
                    onCancel={() => this.setState({ buyDialog: false })}
                    confirmLoading={this.state.isLoading}
                >
                    <div style={{display: "flex"}}><div style={{flexGrow: 1, fontWeight: 700}}>Name</div>{this.state.insurance[this.index].name}</div>
                    <div style={{display: "flex"}}><div style={{marginTop: 3, flexGrow: 1, fontWeight: 700}}>Set premium</div><Input value={this.state.value} onChange={(e) => this.setState({ value: e.target.value })} style={{width: "auto"}} addonAfter={'eth'}/></div>
                </Modal>
            )
        }        
        return null;
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