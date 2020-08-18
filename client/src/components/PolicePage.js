import React, { Component } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Table, Button, Space, Col, Row, message } from 'antd';

class PolicePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      claims: [],
      isClaimsLoading: false,
      isRejectLoading: false,
      isApproveLoading: false
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

  updateData = async () => {
    const { contract, account } = this.props;
    this.setState({ isClaimsLoading: true });
    const products = await this.props.contract.methods.getProducts().call({ from: this.props.account });
    const allClaims = (await contract.methods.getAllClaims().call({ from: account })).map((item) => Object.assign({}, item))
    const claims = allClaims.map((entry, index) => {
      return {
        key: index + 1,
        name: products[entry.productIndex].name,
        approved: entry.isApproved,
        rejected: entry.isRejected,
        amount: this.props.web3.utils.fromWei(entry.amount, 'ether'),
        claimedBy: entry.claimedBy,
        time: this.convertTimestamp(parseInt(entry.time))
      }
    }).filter(item => !item.approved && !item.rejected);
    console.log(claims);
    this.setState({ claims, isClaimsLoading: false });
  }

  componentDidMount() {
    this.updateData();
  }

  takeAction = (type, record) => {
    const { contract, account } = this.props;
    console.log(record);
    switch (type) {
      case "approve":
        contract.methods.approveInsurance(record.key - 1).send({ from: account }).then(() => {
          this.updateData();
          this.props.updateBalance();
          message.success("Transaction Successful");
        })
          .catch(err => {
            message.error(err.message);
          })
        break;
      case "reject":
        contract.methods.rejectInsurance(record.key - 1).send({ from: account }).then(() => {
          this.updateData();
          this.props.updateBalance();
          message.success("Transaction Successful");
        })
          .catch(err => {
            message.error(err.message);
          })
        break;
      default:
        return;
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
        width: 150,
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        width: 80,
        render: (text) => `${text} ETH`
      },
      {
        title: "Action",
        key: 'action',
        render: (text, record) => (
            <Row>
              <Space>
                <Col>
                  <Button type="primary" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} onClick={() => this.takeAction("approve", record)}>Approve</Button>
                </Col>
                <Col>
                  <Button type="primary" style={{ backgroundColor: "#ff0033", borderColor: "#ff0033" }} onClick={() => this.takeAction("reject", record)}>Reject</Button>
                </Col>
              </Space>
            </Row>
          ),
        width: 160
      }
    ];
  }

  render() {
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
                title={() => 'All Claims'}
                dataSource={this.state.claims}
                columns={this.getClaimsColumns()}
                loading={this.state.isClaimsLoading}
                pagination={false}
                bordered
                scroll={{ y: 320 }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PolicePage;