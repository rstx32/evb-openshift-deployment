import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

// schema user admin
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  key: String,
  voterAccess: {
    type: String,
    enum: ['allow', 'deny'],
    default: 'allow',
  },
  candidateAccess: {
    type: String,
    enum: ['allow', 'deny'],
    default: 'allow',
  },
})

const Admin = mongoose.model('Admin', adminSchema)
export { Admin }
