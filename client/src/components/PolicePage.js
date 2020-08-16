import React, {Component} from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Input, Space, Col , Row } from 'antd';

class PolicePage extends Component {
    constructor(props){
        super(props);
        this.state={
            claims: [],
            isClaimsLoading: false
        }
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

    updateData= async ()=>{
        const {contract,account} = this.props;
        this.setState({ isClaimsLoading: true});
        const products = await this.props.contract.methods.getProducts().call({from: this.props.account});
        const allClaims = (await contract.methods.getAllClaims().call({from:account})).map((item)=>Object.assign({},item)).filter(item => !item.isApproved && !item.isRejected);
        const claims = allClaims.map((entry, index) => {
            return {
                key: index + 1,
                name: products[entry.productIndex].name,
                approved: entry.isApproved,
                rejected: entry.isRejected,
                claimedBy: entry.claimedBy,
                time: this.convertTimestamp(parseInt(entry.time))
            }
        });
        console.log(claims);
        this.setState({claims,isClaimsLoading:false});
    }

    componentDidMount(){
        this.updateData();
    }

    takeAction =(type,record)=>{
        const {contract,account} = this.props;
        switch(type){
            case "approve":
                    contract.methods.approveInsurance(record.key-1).send({from:account}).then(()=>{
                        this.updateData();
                        this.props.updateBalance();
                    })
                break;
            case "reject":
                contract.methods.rejectInsurance(record.key-1).send({from:account}).then(()=>{
                    this.updateData();
                    this.props.updateBalance();
                })
                break;
        }
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
                width: 100,
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
                width: 200
            },
            {   
                title: 'Claimer',
                dataIndex: 'claimedBy',
                widtth: 150,
            },
            {
                title: "Action",
                key: 'action',
                render: (text,record) =>(
                    <Row>
                        <Space>
                            <Col>
                                <Button type="primary" onClick={()=>this.takeAction("approve",record)}>Approve</Button>
                            </Col>
                            <Col>
                            <Button type="primary" onClick={()=>this.takeAction("reject",record)}>Reject</Button>
                            </Col>
                        </Space>
                    </Row>)
                
            }
        ];
    }

    render(){
        return(
            <div style={{flexGrow: 1}}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <ArrowLeftOutlined onClick={this.props.onBack} style={{fontSize: 24, marginLeft: 10, marginTop: 10}}/>
                    <span style={{marginRight: 10, marginTop: 10}}><b>Balance: </b>{this.props.balance} eth</span>
                </div>
                <div style={{textAlign:"center"}}>
                    <h1>Police Page</h1>
                    <div style={{display: "flex"}}>
                        <div style={{marginLeft: 10, marginRight: 10, flexGrow: 1}}>
                            <Table 
                                title={() => 'All Claims'}
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
            </div>
        )
    }
}

export default PolicePage;