import * as  crypto from 'crypto';

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
    this.chain = [];
    this.createGenesisBlock();
    //this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]
  }

  createGenesisBlock(){
    this.chain.push(new Block('', new Transaction(100, 'genesis', 'satoshi')))
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
satoshi.createTransaction(50, bob.publicKey);
bob.createTransaction(25, satoshi.publicKey);
alice.createTransaction(10, bob.publicKey);
satoshi.createTransaction(10, alice.publicKey);
rick.createTransaction(30, alice.publicKey);
satoshi.createTransaction(10, rick.publicKey);

console.log(Chain.instance);