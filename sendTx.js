const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
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
    return await web3.eth.getTransactionCount(senderAddress.toLowerCase(), "pending");
}

async function send(){
    TransportNodeHid.open("").then(
        function(transport) {
            const eth = new AppEth(transport);
            return eth.getAddress(derivationPath).then(
                async function(result) {
                    const senderAddress = result['address'];
                    const nonce = await getNonce(result['address']);
                    const gasPrice = await getGasPrice();
                    
                    console.log("Sender address: ", senderAddress);
                    console.log("Gas Price: ", gasPrice);
                    console.log("Nonce: ", nonce);
                    console.log("Gas: ", gas);
                    console.log("To: ", to);
                    
                    rawTx = buildTx(to, nonce, gas, gasPrice);
                    return eth.signTransaction(derivationPath, rawTx.serialize().toString('hex')).then(
                        async function(result){
                            rawTx.r = Buffer.from(result['r'], 'hex');
                            rawTx.v = Buffer.from(result['v'], 'hex');
                            rawTx.s = Buffer.from(result['s'], 'hex');
                            console.log("Raw tx: ", rawTx.serialize().toString('hex'));
                            var txHash = await web3.eth.sendSignedTransaction(rawTx.serialize().toString('hex'));
                            console.log(txHash);
                        }).then(
                            async function (){
                                await transport.close();
                        });
            }).catch(
                function(error) {
                    console.log(error);
                    if(error.message.contains('6a80') > -1) {
                        console.log("- You are attempting to send a transaction that has data without first turning 'contract data' ON in your ledger settings (it's INSIDE THE LEDGER APP SETTINGS)");
                    }
                }
            );
    });
}


(async () => {
    readConfig();
    getWeb3();
    await send();
})();