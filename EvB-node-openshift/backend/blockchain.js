import sha265 from 'crypto-js/sha256.js'
import { getCandidates } from './getAPI.js'
import { broadcastChain } from './p2p.js'
import { io } from './web.js'
dotenv.config({ path: './backend/config/.env' })
const diff = parseInt(process.env.DIFFICULTY)

class Block {
  // block mempunyai atribut index, previousHash, timestamp, data, hash, difficulty, dan nonce
  constructor(index, previousHash, timestamp, data, hash, difficulty, nonce) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.data = data
    this.hash = hash
    this.difficulty = difficulty
    this.nonce = nonce
  }
}

// fungsi untuk menghitung hash
const calculateHash = (index, prevHash, timestamp, data, difficulty, nonce) => {
  return sha265(index + prevHash + timestamp + data + difficulty + nonce).toString()
}

// fungsi untuk menghitung hash (parameter : block)
const blockCalculateHash = (block) => {
  return calculateHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  )
}

// fungsi untuk mendapatkan block terakhir
const latestBlock = () => {
  return blockchain[blockchain.length - 1]
}

// fungsi untuk mendapatkan timestamp
const getTimestamp = () => {
  return new Date().getTime()
}

// genesis untuk block pertama pada blockchain
const genesis = new Block(
  0,
  '0',
  1638105751888,
  {
    voterID: 'genesis block',
    candidateID: 'genesis block',
    signature: 'genesis block',
  },
  calculateHash(0, '', 1638105751888, {
    voterID: 'genesis block',
    candidateID: 'genesis block',
    signature: 'genesis block',
  }),
  0,
  0
)

// inisiasi array of blockchain, dengan block pertama genesis
let blockchain = [genesis]

// fungsi untuk menampilkan blockchain
const getBlocks = () => {
  return blockchain
}

// replace current blockchain
const replaceChain = async (newBlockchain) => {
  if (isBlockchainValid(newBlockchain) && newBlockchain.length > getBlocks().length) {
    console.log(`replacing current blockchain with received blockchain\n`)
    blockchain = newBlockchain
    io.sockets.emit('broadcast', await getCandidatesRecap())
    io.sockets.emit('voters', getBlocks())
  } else if (newBlockchain.length === getBlocks().length) {
    console.log(`current and received blockchain are the same length\n`)
  } else {
    console.log(`failed to replace blockchain\n`)
  }
}

const forceReplaceChain = async (newBlockchain) => {
  blockchain = newBlockchain
  io.sockets.emit('broadcast', await getCandidatesRecap())
  io.sockets.emit('voters', getBlocks())
}

// membuat block baru
const newBlock = (data) => {
  const newIndex = latestBlock().index + 1
  const prevHash = latestBlock().hash
  const newTimestamp = getTimestamp()
  addBlock(findBlock(newIndex, prevHash, newTimestamp, data, diff))
}

// menambahkan block ke dalam blockchain
const addBlock = async (block) => {
  if (isStructureValid(block) && isBlockValid(latestBlock(), block)) {
    blockchain.push(block)
    console.log(`a new block added! ${block.hash}`)
    broadcastChain(blockchain)
    
    io.sockets.emit('broadcast', await getCandidatesRecap())
    io.sockets.emit('voters', getBlocks())

    return true
  }
  console.log(`block failed!`)
  return false
}

///// validation zone /////
// memvalidasi isi tipe data block
const isStructureValid = (block) => {
  return (
    typeof block.index === 'number' &&
    typeof block.previousHash === 'string' &&
    typeof block.timestamp === 'number' &&
    typeof block.data === 'object' &&
    typeof block.data.voterID === 'string' &&
    typeof block.data.candidateID === 'string' &&
    typeof block.data.signature === 'string' &&
    typeof block.hash === 'string' &&
    typeof block.difficulty === 'number' &&
    typeof block.nonce === 'number'
  )
}

// memvalidasi block baru
// 1. cek struktur block
// 2. cek apakah index block baru lebih besar dari block sebelumnya
// 3. cek apakah newBlock.prevHash sama dengan hash block sebelumnya
// 4. cek ulang hash block
const isBlockValid = (prevBlock, newBlock) => {
  if (!isStructureValid(newBlock)) {
    console.log(`invalid block structure!`)
    return false
  } else if (prevBlock.index + 1 !== newBlock.index) {
    console.log('invalid index block')
    return false
  } else if (newBlock.previousHash !== prevBlock.hash) {
    console.log('invalid previous hash')
    return false
  } else if (blockCalculateHash(newBlock) !== newBlock.hash) {
    console.log(blockCalculateHash(newBlock))
    console.log(newBlock.hash)

    console.log(`invalid block hash`)
    return false
  }
  return true
}

// validasi blockchain, parameter : blockchain[]
// cek genesis kemudian cek block satu per satu
const isBlockchainValid = (blockchain) => {
  const isGenesisValid = () => {
    return sha265(blockchain[0]).toString() === sha265(genesis).toString()
  }

  if (!isGenesisValid()) {
    console.log(`genesis invalid`)
    return false
  }

  for (let i = 1; i < blockchain.length; i++) {
    if (!isBlockValid(blockchain[i - 1], blockchain[i])) {
      return false
    }
  }

  return true
}

// validasi apakah enkripsi sudah sesuai dengan ketentuan
const isHashMatchDifficulty = (blockHash, difficulty) => {
  const binaryHash = hexToBinary(blockHash)
  const reqDiff = '0'.repeat(difficulty)
  return binaryHash.startsWith(reqDiff)
}
///// validation zone /////

// hexadecimal to binary
const hexToBinary = (s) => {
  let ret = ''
  const lookupTable = {
    0: '0000',
    1: '0001',
    2: '0010',
    3: '0011',
    4: '0100',
    5: '0101',
    6: '0110',
    7: '0111',
    8: '1000',
    9: '1001',
    a: '1010',
    b: '1011',
    c: '1100',
    d: '1101',
    e: '1110',
    f: '1111',
  }
  for (let i = 0; i < s.length; i = i + 1) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]]
    } else {
      return null
    }
  }
  return ret
}

// menemukan block dengan hash sesuai dengan ketentuan
const findBlock = (index, prevHash, timestamp, data, diff) => {
  let nonce = 0
  while (true) {
    const hash = calculateHash(index, prevHash, timestamp, data, diff, nonce)
    if (isHashMatchDifficulty(hash, diff)) {
      return new Block(index, prevHash, timestamp, data, hash, diff, nonce)
    }
    nonce++
  }
}

// mengecek apakah voter sudah melakukan voting
const isVoted = (id) => {
  for (let index = 0; index < blockchain.length; index++) {
    if (blockchain[index].data.voterID === id) {
      return true
    }
  }
  return false
}

// export detail block voter
const getBlock = (id) => {
  // return blockchain.find((block) => block.data.voterID === id)
  for (let index = 0; index < blockchain.length; index++) {
    if (blockchain[index].data.voterID === id) {
      return blockchain[index]
    }
  }
}

// export candidate vote
const getCandidatesRecap = async () => {
  const candidates = await getCandidates()
  const hasil = []
  for (let index = 0; index < candidates.length; index++) {
    hasil[index] = {
      _id: candidates[index]._id,
      candidate: candidates[index].candidate,
      viceCandidate: candidates[index].viceCandidate,
      photo: candidates[index].photo,
      count: countCandidate(candidates[index]._id),
    }
  }
  return hasil
}

// method untuk menghitung jumlah vote kandidat
const countCandidate = (candidateID) => {
  let tampung = 0
  for (const iterator of blockchain) {
    if (iterator.data.candidateID === candidateID) tampung++
  }
  return tampung
}

// export module
export {
  getBlocks,
  replaceChain,
  newBlock,
  isVoted,
  getBlock,
  getCandidatesRecap,
  isBlockchainValid,
  forceReplaceChain,
}

// const prevBlock = blockchain[0].hash
// const contoh = new Block(
//   1,
//   prevBlock,
//   1654298449,
//   {
//     voterID: 'contoh block intruder',
//     candidateID: 'contoh block intruder',
//     signature: 'contoh block intruder',
//   },
//   calculateHash(0, prevBlock, 1654298449, {
//     voterID: 'contoh block intruder',
//     candidateID: 'contoh block intruder',
//     signature: 'contoh block intruder',
//   }),
//   5,
//   78
// )
// blockchain.push(contoh)

// blockchain.pop()
