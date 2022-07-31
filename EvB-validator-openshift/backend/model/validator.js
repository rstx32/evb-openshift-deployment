import mongoose from 'mongoose'
import dotenv from 'dotenv'
import passportLocalMongoose from 'passport-local-mongoose'
dotenv.config({ path: 'backend/config/.env' })

// Connecting Mongoose
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// schema user validator
const validatorSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  key: String,
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

validatorSchema.plugin(passportLocalMongoose)

export default mongoose.model('Validator', validatorSchema)
