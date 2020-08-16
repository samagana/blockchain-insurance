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
        <div style={{borderRadius:"2px",backgroundColor:"#096dd9",margin:`0px 0px 20px ${index > 0 ? '20px' : '0px'}`,padding:"10px"}} key={block.number}>
            <div>B-Number: {block.number}</div>
            <div>Gas Used: {block.gasUsed}</div>
            <div>Timestamp: {block.timestamp}</div>
        </div>
        ) 
      }

      render(){
            return(
                    <div style={{display:"flex",flexDirection:"row",overflowX:"auto",justifyContent:"center",alignItems:"center",color:"white",fontSize:"12px"}}>
                    {
                        this.state.blocks.length>0?
                            this.generateBlocks()
                            :
                            <div style={{borderRadius:"8px",textAlign:"center",backgroundColor:"#096dd9",margin:"0px 25px 20px 25px",padding:"10px"}}>
                                <h3 style={{color: "#fff"}}>Loading block explorer</h3>
                                <Spin indicator={antIcon} />
                            </div>
                    }
                    </div>
                )
                
      }
}

export default BlockExplorer;