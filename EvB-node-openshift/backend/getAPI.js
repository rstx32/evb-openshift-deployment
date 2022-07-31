import fetch from 'node-fetch'
import dotenv from 'dotenv'
import jsonwebtoken from 'jsonwebtoken'
dotenv.config({ path: 'backend/config/.env' })

// generate JWT for API Auth
const token = jsonwebtoken.sign({ username: process.env.NODE_ID }, process.env.JWT, {
  expiresIn: '7d',
})

// get voter (full)
const getVoter = async (nim) => {
  if (nim !== undefined) {
    const voter = await fetch(`http://${process.env.API_URL}/voter?nim=${nim}`, {
      method: 'get',
      headers: {
        token: token,
      },
    })
    return voter.json()
  } else {
    const voter = await fetch(`http://${process.env.API_URL}/export/voter`, {
      method: 'get',
      headers: {
        token: token,
      },
    })
    return voter.json()
  }
}

// get voter password
const getVoterPasswd = async (nim) => {
  const voter = await getVoter(nim)
  const password = voter.password
  return password
}

// get voter public key
const getVoterPubKey = async (nim) => {
  const voter = await getVoter(nim)
  const public_key = voter.public_key
  return public_key
}

// get all candidates
const getCandidates = async () => {
  const candidates = await fetch(`http://${process.env.API_URL}/export/candidate`, {
    method: 'get',
    headers: {
      token: token,
    },
  })
  return await candidates.json()
}

export { getCandidates, getVoterPasswd, getVoterPubKey, getVoter }
