import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'

// schema candidate
const complaintSchema = mongoose.Schema({
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

complaintSchema.plugin(paginate)

export default mongoose.model('Complaint', complaintSchema)
