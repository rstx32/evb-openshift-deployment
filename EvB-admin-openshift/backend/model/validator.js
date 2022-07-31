import mongoose from 'mongoose'

// schema validator
const validatorSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  token: {
    type: String,
    default: null,
  },
  voter: {
    status: {
      type: String,
      enum: ['-', 'valid', 'invalid'],
      default: '-',
    },
    reason: {
      type: String,
      default: '-',
    },
    solve: {
      type: String,
      enum: ['-', 'solved', 'unsolved', 'reject', 'accept'],
      default: '-',
    },
  },
  candidate: {
    status: {
      type: String,
      enum: ['-', 'valid', 'invalid'],
      default: '-',
    },
    reason: {
      type: String,
      default: '-',
    },
    solve: {
      type: String,
      enum: ['-', 'solved', 'unsolved', 'reject', 'accept'],
      default: '-',
    },
  },
})

export default mongoose.model('Validator', validatorSchema)
