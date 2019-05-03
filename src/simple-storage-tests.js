const Web3 = require('web3')
const config = require('config')


const counter = {
  'totalLoop': 0,
  'totalTx': 0,
  'totalSuccess': 0,
  'totalError': 0,
}

let account = {
  'address': null,
}

const contract = {
  'abi': [{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_x","type":"uint256"}],"name":"DataUpdate","type":"event"}],
  'bytecode': '0x608060405234801561001057600080fd5b5061011d806100206000396000f3fe6080604052600436106043576000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460485780636d4ce63c14607f575b600080fd5b348015605357600080fd5b50607d60048036036020811015606857600080fd5b810190808035906020019092919050505060a7565b005b348015608a57600080fd5b50609160e8565b6040518082815260200191505060405180910390f35b806000819055507fa002481b66f5dc917a6a3be1e1c2569cde886c6f0493f7cfcdfc64d6dc0b034a816040518082815260200191505060405180910390a150565b6000805490509056fea165627a7a72305820c1b554cf4fd71d3942610d56d634771a529db7166058b560b16ec6d71836c6a50029'
}

const web3 = new Web3(config.provider)

class SimpleTest {
  async testConnection () {
    return web3.eth.net.isListening()
  }

  async getAccount () {
    return web3.eth.getAccounts()
  }

  deploy () {
    return new Promise((resolve, reject) => {
      const simplestorageContract = new web3.eth.Contract(contract.abi)
      simplestorageContract.deploy({
        data: contract.bytecode,
      })
        .send({
          from: account.address,
          gas: 1500000,
          gasPrice: 0,
          privateFor: config.privateFor,
        })
        .on('error', (err) => { reject(err) })
        .on('transactionHash', (transactionHash) => {
          // console.log('transactionHash', transactionHash)
        })
        .on('receipt', (receipt) => resolve(receipt.contractAddress))
        .catch(err => reject(err))
    })
  }

  loop (contractAddress) {
    console.log('Start loop on contract:', contractAddress)
    const simplestorageContract = new web3.eth.Contract(contract.abi, contractAddress)
    setTimeout(() => {
      let i

      if (config.maxTx != 0 && counter.totalTx <= config.maxTx)
        for (i = 0; i < config.txPerBlock; i++) {
          simplestorageContract.methods.set(123).send({
            from: account.address,
            privateFor: config.privateFor,
          })
            .then(receipt => {
              console.log('Tx success:', receipt.transactionHash)
              counter.totalSuccess += 1
            })
            .catch(err => {
              console.error('Tx failure', err.message)
              counter.totalError += 1
            })
          counter.totalTx += 1
        }
      counter.totalLoop += 1
      console.log(i, 'tx just sent')
      console.log('Total loop:', counter.totalLoop, 'Total tx sent:', counter.totalTx, ', total tx success:', counter.totalSuccess, ', total tx error:', counter.totalError)
      console.log('---------------------------------------------')
      this.loop(contractAddress)
    }, 5000)
  }

  async start () {
    try {
      console.log('Start script')
      await this.testConnection()
      console.log('Connected to node:', config.provider)
      const accounts = await this.getAccount()
      account.address = accounts[0]
      console.log('Account address is:', account.address)
      const contractAddress = await this.deploy()
      console.log('Contract address is:', contractAddress)
      this.loop(contractAddress)
    } catch (err) {
      console.error('Start failure', err)
    }
  }
}

const simpleTest = new SimpleTest()
simpleTest.start()