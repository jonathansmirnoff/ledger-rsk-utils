const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const BN = require('bn.js');
const Common = require('ethereumjs-common').default;

var valueToSend;
var to;
var rskNode;
var rawTx;
var derivationPath;
var chainId;
var web3;

function getWeb3() {
    if (web3) {
      return web3;
    }
  
    console.log('Using web3', rskNode);
    web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(rskNode));
  
    return web3;
}

function readConfig(){
    const obj=JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    rskNode = obj.rskNode;
    valueToSend = obj.valueToSend;
    to = obj.to;
    gas = obj.gas;    
    chainId = obj.chainId;
    derivationPath = obj.derivationPath;  
}

function buildTx(to, nonce, gas, gasPrice) {
    var rawTx = {
        nonce: nonce,
        gasPrice: gasPrice,
        gas: gas,
        value: valueToSend,
        to: to
    };

    //The idea for the nexts lines was get from MEW:
    //https://github.com/MyEtherWallet/MyEtherWallet/blob/master/src/wallets/hardware/ledger/index.js#L62
    //https://github.com/MyEtherWallet/MyEtherWallet/blob/fad586bef60591d3e89b25c00038901cec015019/src/helpers/commonGenerator.js#L3
    //Doing this you can use the version 2.1.2 of ethereumjs-tx avoiding eip-155 validation. 
    const commonRskGenerator = Common.forCustomChain('mainnet', {
        name: 'rsk',
        chainId: chainId
    });
    rskCommon = new Common(commonRskGenerator._chainParams, 'petersburg', ['petersburg']);
    var tx = new Tx(rawTx, { common: rskCommon });
    tx.raw[6] = chainId;
    tx.raw[7] = Buffer.from([]);
    tx.raw[8] = Buffer.from([]);
    return tx;
}

async function getGasPrice(){
    const block = await web3.eth.getBlock("latest");
    return block.minimumGasPrice;
}

async function getNonce(senderAddress){
    const count = await web3.eth.getTransactionCount(senderAddress.toLowerCase(), "pending");    
    return "0x" + (new BN(count)).toString(16);
}

const send = async () => {
    try{    
        const transport = await Transport.create();
        const eth = new AppEth(transport);
        const result = await eth.getAddress(derivationPath);

        const senderAddress = result.address;
        const nonce = await getNonce(senderAddress);
        const gasPrice = await getGasPrice();
                    
        console.log("Sender address: ", senderAddress);
        console.log("To address: ", to);
        console.log("Value: ", valueToSend);
        console.log("Gas Price: ", gasPrice);
        console.log("Nonce: ", nonce);
        console.log("Gas: ", gas);        

        let rawTx = buildTx(to, nonce, gas, gasPrice);
        const signedTx = await eth.signTransaction(derivationPath, rawTx.serialize().toString('hex'));

        rawTx.r = Buffer.from(signedTx.r, 'hex');
        rawTx.v = Buffer.from(signedTx.v, 'hex');
        rawTx.s = Buffer.from(signedTx.s, 'hex');
        
        console.log("Signed raw tx: ", rawTx.serialize().toString('hex'));
        const txHash = await web3.eth.sendSignedTransaction(rawTx.serialize().toString('hex'));
        console.log(txHash);
    }
    catch(err){
        console.log(err);
    }
};

(async () => {
    readConfig();
    getWeb3();    
    await send();
})();