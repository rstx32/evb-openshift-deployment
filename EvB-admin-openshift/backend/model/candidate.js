import mongoose from 'mongoose'

// schema candidate
const candidateSchema = mongoose.Schema({
    candidate : {
        type: String,
        required: true,
    },
    viceCandidate : String,
    photo: String,
})

export default mongoose.model('Candidate', candidateSchema)