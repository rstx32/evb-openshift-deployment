import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

// schema candidate
const complaintSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'please write your email'],
  },
  comment: {
    type: String,
    required: [true, 'please write your complaint'],
  },
  status: {
    type: String,
    enum: ['unsolved', 'solved'],
    default: 'unsolved',
  },
})

const Complaint = mongoose.model('Complaint', complaintSchema)

export { Complaint }
