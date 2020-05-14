const fs = require('fs');
const Web3 = require('web3');
const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const AppBtc = require("@ledgerhq/hw-app-btc").default;
const config = require('./config.json');
const precompiled = require('@rsksmart/rsk-precompiled-abis');


const getFederationAddress = async function(){
    const bridge = precompiled.bridge.build(new Web3('https://public-node.rsk.co'));
    const address = await bridge.methods.getFederationAddress().call();
    console.log('Federation Address:');
    console.log(address);    
}

const getBtcAddress = async () => {
    try{    
        const transport = await Transport.create();
        const btc = new AppBtc(transport);
        const result = await btc.getWalletPublicKey(config.derivationPath);

        console.log('BTC Address');        
        console.log(result.bitcoinAddress);        
        console.log('Derivation Path: ' + config.derivationPath);
    }
    catch(err){
        console.log(err);
    }
};

const getRskAddress = async () => {
    try{    
        const transport = await Transport.create();
        const eth = new AppEth(transport);
        const result = await eth.getAddress(config.derivationPath);

        console.log('RSK Address');
        console.log(result.address);
        console.log('Derivation Path: ' + config.derivationPath);
    }
    catch(err){
        console.log(err);
    }
};

(async () => {
    await getBtcAddress();
    console.log('');
    await getFederationAddress();
    console.log('');
    await getRskAddress();
})();