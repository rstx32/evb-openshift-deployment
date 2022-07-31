import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

// schema voter
const voterSchema = new mongoose.Schema({
  nim: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: null,
  },
  public_key: {
    type: String,
    default: null,
  },
  photo: String,
  key: {
    registration: {
      type: String,
      min: 6,
      max: 6,
    },
    reset_password: {
      type: String,
      min: 6,
      max: 6,
      default: null,
    },
  },
})

const Voter = mongoose.model('voter', voterSchema)

export { Voter }
