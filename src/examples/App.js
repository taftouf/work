import React from "react";
import { Button } from "../lib";

const App = () => {
  const tokens = [
                    {address: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709", symbol: "Link", decimal: "18",amount: "1"},
                    {address: "0xeb8f08a975Ab53E34D8a0330E0D34de942C95926", symbol: "USDC", decimal: "6",amount: "10"}
                  ];
  
  return(
    <div style={{ width: 640, margin: "15px auto" }}>
      <h1>Test Component</h1>
      
      <Button 
        label="Pay With Crypto"
        amount="0.001" 
        receiver="0xfe1167Cb42d0a06f0C2c64d4fE2708e12328e22E" 
        tokens = {tokens}
      />
    </div>
  )
};

export default App;
