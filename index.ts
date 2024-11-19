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

  
}

class Wallet {

}

