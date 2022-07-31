import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { getSingleValidator } from './db.js'
dotenv.config({ path: 'backend/config/.env' })

const getVoters = async (query, validatorID) => {
  // if query is empty, then add default query
  if (Object.keys(query).length === 0) {
    query = {
      limit: 5,
      page: 1,
    }
  }

  let voters = {}
  const validatorToken = await getSingleValidator(validatorID, 'findbyid')
  const token = validatorToken.token

  if (query.fullname === undefined) {
    voters = await fetch(
      `http://${process.env.API_URL}/export/voter?page=${query.page}&limit=${query.limit}`,
      {
        method: 'get',
        headers: {
          token: token,
        },
      }
    )
  } else {
    voters = await fetch(
      `http://${process.env.API_URL}/export/voter?fullname=${query.fullname}`,
      {
        method: 'get',
        headers: {
          token: token,
        },
      }
    )
  }

  return await voters.json()
}

const getCandidates = async (validatorID) => {
  const validatorToken = await getSingleValidator(validatorID, 'findbyid')
  const token = validatorToken.token
  const candidates = await fetch(
    `http://${process.env.API_URL}/export/candidate`,
    {
      method: 'get',
      headers: {
        token: token,
      },
    }
  )
  return await candidates.json()
}

export { getVoters, getCandidates }
