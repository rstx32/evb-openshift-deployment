import { Network, AnonymousAuth } from 'ataraxia'
import { TCPTransport, TCPPeerMDNSDiscovery } from 'ataraxia-tcp'
import {
  getBlocks,
  replaceChain,
  isBlockchainValid,
  forceReplaceChain,
} from './blockchain.js'

const net = new Network({
  name: 'evb-node',
  transports: [
    new TCPTransport({
      discovery: new TCPPeerMDNSDiscovery(),
      authentication: [new AnonymousAuth()],
    }),
  ],
})

console.log(`running node ${net.networkId}`)

net.onNodeAvailable((node) => {
  console.log(`connected to node ${node.id}`)
  console.log(`total nodes connected: `, net.nodes.length, `\n`)
  node.send('blockchain', getBlocks())
})

net.onNodeUnavailable((node) => {
  console.log(`node ${node.id} disconnected `)
  console.log(`total nodes connected: `, net.nodes.length, `\n`)
})

net.onMessage((msg) => {
  if (msg.type === 'blockchain reject') {
    console.log(`blockchain rejected from ${msg.source.id}`)
    console.log(`replacing current blockchain with valid blockchain`)
    forceReplaceChain(msg.data)
  } else {
    if (isBlockchainValid(msg.data)) {
      console.log(`received valid ${msg.type} from ${msg.source.id}`)
      replaceChain(msg.data)
    } else {
      console.log(`received invalid ${msg.type} from ${msg.source.id}`)
      msg.source.send('blockchain reject', getBlocks())
    }
  }
})

const broadcastChain = (blockchain) => {
  net.broadcast('blockchain', blockchain)
  console.log(`broadcasting to all nodes`)
}

export { net, broadcastChain }
