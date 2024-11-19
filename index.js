"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const filePath = 'blockchain.json';
function saveBlockchain(blockchain) {
    fs.writeFileSync(filePath, JSON.stringify(blockchain, null, 2));
}
function loadBlockchain() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        // Convert each parsed JSON block back into a Block instance
        return parsedData.map((block) => new Block(block.prevHash, 
        // Deserialize transaction from a plain object to a Transaction instance
        new Transaction(block.transaction.amount, block.transaction.sender, block.transaction.receiver), block.timestamp));
    }
    else {
        return null; // Return null if no data exists (first run)
    }
}
class Transaction {
    constructor(amount, sender, reciever) {
        this.amount = amount;
        this.sender = sender;
        this.reciever = reciever;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, transaction, timestamp = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.timestamp = timestamp;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('sha256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
class Chain {
    constructor() {
        // Load blockchain from file or create a new one
        const savedBlockchain = loadBlockchain();
        this.chain = savedBlockchain ? savedBlockchain : [this.createGenesisBlock()];
        //this.chain = [];
        //this.createGenesisBlock();
        //this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]
    }
    createGenesisBlock() {
        return new Block('', new Transaction(100, 'genesis', 'satoshi'));
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verify = crypto.createVerify('sha256');
        verify.update(transaction.toString());
        //const publicKey = crypto.createPublicKey(senderPublicKey);
        const result = verify.verify(senderPublicKey, signature);
        if (result) {
            const block = new Block(this.lastBlock.hash, transaction);
            this.mine(block.nonce);
            this.chain.push(block);
            saveBlockchain(this.chain);
        }
    }
    mine(nonce) {
        let solution = 1;
        console.log("mining...");
        while (true) {
            const hash = crypto.createHash('md5');
            hash.update((nonce + solution).toString()).end();
            const guessHash = hash.digest('hex');
            if (guessHash.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            else {
                solution += 1;
            }
        }
    }
}
Chain.instance = new Chain();
class Wallet {
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
    createTransaction(amount, recipientPublicKey) {
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
