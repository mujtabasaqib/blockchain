import * as  crypto from 'crypto';
import * as fs from 'fs';

const filePath = 'blockchain.json';

function saveBlockchain(blockchain: Block[]) {
  fs.writeFileSync(filePath, JSON.stringify(blockchain, null, 2));
}

function loadBlockchain(): Block[] | null {
  if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(data);

      // Convert each parsed JSON block back into a Block instance
      return parsedData.map((block: any) => new Block(
          block.prevHash,
          // Deserialize transaction from a plain object to a Transaction instance
          new Transaction(block.transaction.amount, block.transaction.sender, block.transaction.receiver),
          block.timestamp
      ));
  } else {
      return null; // Return null if no data exists (first run)
  }
}

class Transaction {
  constructor(
    public amount: number,
    public sender: string,
    public reciever: string
  ) {}
  toString(){
    return JSON.stringify(this)
  }
}

class Block {

  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public timestamp = Date.now()
  ) {}

  get hash(){
    const str = JSON.stringify(this);
    const hash = crypto.createHash('sha256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

class Chain {
  public static instance = new Chain();
  chain: Block[]

  constructor() {
    // Load blockchain from file or create a new one
    const savedBlockchain = loadBlockchain();
    this.chain = savedBlockchain ? savedBlockchain : [this.createGenesisBlock()];
    //this.chain = [];
    //this.createGenesisBlock();
    //this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]
  }

  createGenesisBlock(){
    return new Block('', new Transaction(100, 'genesis', 'satoshi'));
  }

  get lastBlock(){
    return this.chain[this.chain.length - 1]
  }

  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer){
    const verify = crypto.createVerify('sha256');
    verify.update(transaction.toString());
    //const publicKey = crypto.createPublicKey(senderPublicKey);
    const result = verify.verify(senderPublicKey, signature);
    if(result){
      const block = new Block(this.lastBlock.hash, transaction);
      this.mine(block.nonce);
      this.chain.push(block);
      saveBlockchain(this.chain);
    }
  }

  mine(nonce: number){
    let solution = 1;
    console.log("mining...");
    while(true){
      const hash = crypto.createHash('md5');
      hash.update((nonce + solution).toString()).end();
      const guessHash = hash.digest('hex');
      if(guessHash.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }else{
        solution += 1;
      }
    }
  }

  
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  createTransaction(amount: number, recipientPublicKey: string){
    const transaction = new Transaction(amount, this.publicKey, recipientPublicKey);
    const sign = crypto.createSign('sha256');
    sign.update(transaction.toString()).end();
    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

//example use
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
const rick = new Wallet();
satoshi.createTransaction(51, bob.publicKey);
bob.createTransaction(23, satoshi.publicKey);
alice.createTransaction(13, bob.publicKey);
satoshi.createTransaction(19, alice.publicKey);
rick.createTransaction(33, alice.publicKey);
satoshi.createTransaction(11, rick.publicKey);

console.log(Chain.instance);