import multer from 'multer'
import sha256 from 'crypto-js/sha256.js'

// define storage
// set destination path & filename
// filename : name are mixed nim & timestamp with sha256 encryption
const voterMulterStorage = multer.diskStorage({
  destination: 'public/photo/voters',
  filename: (req, file, cb) => {
    const name = sha256(req.body.nim + Date.now())
    const extension = file.mimetype.split('/')[1]
    cb(null, 'voter-' + name + '.' + extension)
  },
})

const voterFileMulterStorage = multer.diskStorage({
  destination: 'backend',
  filename: (req, file, cb) => {
    cb(null, 'voterFile.xlsx')
  },
})

const candidateMulterStorage = multer.diskStorage({
  destination: 'public/photo/candidates',
  filename: (req, file, cb) => {
    const name = sha256(req.body.candidate + Date.now())
    const extension = file.mimetype.split('/')[1]
    cb(null, 'candidate-' + name + '.' + extension)
  },
})

// define filter
// extenstion must be JPG / JPEG
const multerFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(new Error('Not a JPG File!'), false)
  }
}

// filter for upload voter XLSX
const xlsxFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true)
  } else {
    cb(new Error('Not a XLSX File!'), false)
  }
}

// use both above strorage & filter configuration
const voterUpload = multer({
  storage: voterMulterStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 }, // max 1MB per photo
})

// voter file upload
const voterFileUpload = multer({
  storage: voterFileMulterStorage,
  fileFilter: xlsxFilter,
})

// use both above strorage & filter configuration
const candidateUpload = multer({
  storage: candidateMulterStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 }, // max 1MB per photo
})

export { voterUpload, voterFileUpload, candidateUpload }
