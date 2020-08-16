import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const antIcon = <LoadingOutlined style={{ fontSize: 24, color: "#fff" }} spin />;

class BlockExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          blocks: [],
        }
      }

      componentDidMount(){
          const {web3} = this.props;
          web3.eth.subscribe('newBlockHeaders', (error, result)=>{
            if (!error) {
                var old = this.state.blocks.slice(Math.max(this.state.blocks.length - 10, 0))
                old.push(result);
                this.setState({blocks:old});
                return;
            }

            console.error(error);
        }) 

      }

      generateBlocks = () =>{
        return this.state.blocks.map((block, index)=>
<<<<<<< HEAD
        <div style={{borderRadius:"2px",backgroundColor:"#096dd9",padding:"10px"}} key={block.number}>
            <div>B-Number: {block.number}</div>
=======
        <div style={{borderRadius:"2px",backgroundColor:"#08979c",margin:`10px 0px 10px ${index > 0 ? '20px' : '0px'}`,padding:"10px"}} key={block.number}>
            <div>Block Number: {block.number}</div>
>>>>>>> cd39870b3074043d28a8ca1ef0366de6591a0ff8
            <div>Gas Used: {block.gasUsed}</div>
            <div style={{width: 120}}>Timestamp: {this.convertTimestamp(parseInt(block.timestamp))}</div>
        </div>
        ) 
      }

      render(){
            return(
<<<<<<< HEAD
                    <div style={{position:"absolute",bottom:"10px",display:"inline-flex",gap:"30px",width:"100%",flexDirection:"row",overflowX:"auto",justifyContent:"center",alignItems:"center",color:"white",fontSize:"12px"}}>
=======
                    <div style={{display:"flex",flexDirection:"row",overflowX:"auto",justifyContent:"center",alignItems:"center",color:"white",fontSize:"12px",backgroundColor: "#f5f5f5"}}>
>>>>>>> cd39870b3074043d28a8ca1ef0366de6591a0ff8
                    {
                        this.state.blocks.length>0?
                            this.generateBlocks()
                            :
                            <div style={{borderRadius:"2px",textAlign:"center",backgroundColor:"#08979c",margin:"10px 0px 10px 0px",padding:"10px", height: 95}}>
                                <h3 style={{color: "#fff", width: 120, marginBottom: 16}}>Tracking</h3>
                                <Spin indicator={antIcon} />
                            </div>
                    }
                    </div>
                )
                
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

export default BlockExplorer;