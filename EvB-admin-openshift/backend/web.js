import * as fs from 'fs'
import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import methodOverride from 'method-override'
import passport from 'passport'
import session from 'express-session'
import { ensureLoggedIn } from 'connect-ensure-login'
import flash from 'connect-flash'
import * as XLSX from 'xlsx/xlsx.mjs'
import { voterUpload, voterFileUpload, candidateUpload } from './multer.js'
import {
  getVoters,
  addVoter,
  getSingleVoter,
  deleteVoter,
  editVoter,
  addPubKey,
  getCandidates,
  addCandidate,
  deleteCandidate,
  getValidator,
  solveError,
  tokenValidation,
  isAdminAllowed,
  receiveComplaint,
  isComplaintExist,
  getComplaints,
  solveComplaint,
  sendResetKey,
  resetPassword,
  createAccount,
  resetKeyValidation,
  removeUnusedPhoto,
  isComplaintAllowed,
  getSingleCandidate,
} from './db.js'
import { voterValidation, candidateValidation, voterValidate } from './validation.js'
import Admin from './model/admin.js'

const voterPhoto = voterUpload.single('voterPhotoUpload')
const candidatePhoto = candidateUpload.single('candidatePhotoUpload')
const voterFile = voterFileUpload.single('voterFile')
const app = express()
  .set('view engine', 'ejs')
  .use(express.urlencoded({ extended: false }))
  .use(expressLayouts)
  .use(express.static('public'))
  .use(methodOverride('_method'))
  .use(
    session({
      cookie: { maxAge: 1000 * 60 * 60 },
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

passport.use(Admin.createStrategy())
passport.serializeUser(Admin.serializeUser())
passport.deserializeUser(Admin.deserializeUser())

// register page
app.get('/register', (req, res) => {
  const successMessage = req.flash('successMessage')
  const errorMessage = req.flash('errorMessage')

  res.render('auth/register', {
    layout: 'layouts/auth-layout',
    title: 'Voter Registration',
    flashMessage: { successMessage, errorMessage },
  })
})

app.post('/register', async (req, res) => {
  const { error, value } = voterValidate(req.body, 'validateByKey')
  if (error) {
    req.flash('errorMessage', 'invalid key format!')
    res.redirect('register')
  } else {
    const voter = await getSingleVoter(req.body.key, 'findbykey')

    if (voter === null) {
      req.flash('errorMessage', 'invalid key, or voter has been registered!')
      res.redirect('register')
    } else {
      res.render('auth/register-2', {
        layout: 'layouts/auth-layout',
        voter,
        title: 'Voter Registration',
      })
    }
  }
})

app.post('/register2', async (req, res) => {
  const isSucced = await addPubKey(req.body)

  if (isSucced) {
    req.flash('successMessage', `registration complete!`)
    res.redirect('register')
  } else {
    req.flash('errorMessage', `voter has been registered!`)
    res.redirect('register')
  }
})

// login page
app.get(
  '/login',
  (req, res, next) => {
    if (req.isAuthenticated()) res.redirect('/voters')
    else next()
  },
  (req, res, next) => {
    const errorMessage = req.flash('errorMessage')
    const successMessage = req.flash('successMessage')

    res.render('auth/login', {
      layout: 'layouts/auth-layout',
      title: 'EvB-Admin Login',
      flashMessage: { errorMessage, successMessage },
    })
  }
)

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: {
      type: 'errorMessage',
      message: 'wrong username or password!',
    },
    successRedirect: '/voters',
  })
)

// logout
app.get('/logout', (req, res) => {
  req.logout()
  req.flash('successMessage', 'logged out')
  res.redirect('/login')
})

// homepage
app.get('/', (req, res) => {
  res.render('root', {
    layout: 'layouts/public-layout',
    title: 'Homepage EvB-admin',
  })
})

/////////////////////////////////////////// voters ///////////////////////////////////////////
// get all voters
app.get('/voters', ensureLoggedIn(), async (req, res) => {
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')
  const voters = await getVoters(req.query)
  const user = req.user.username
  const validator = await getValidator()
  const admin = await Admin.findOne({ username: 'admin' })

  res.render('voters', {
    layout: 'layouts/main-layout',
    title: 'voters',
    voters,
    user,
    flashMessage: { errorMessage, successMessage },
    validator,
    adminStatus: admin.voterAccess,
  })
})

// add voters
// check if admin allow to CRUD
// check if photo is valid
// check if voter is exist
app.post('/voters', ensureLoggedIn(), isAdminAllowed, (req, res) => {
  voterPhoto(req, res, async (err) => {
    if (err) {
      req.flash('errorMessage', 'invalid photo file!')
      res.redirect('/voters')
    } else {
      const { error, value } = voterValidation(req.body)

      if (error) {
        req.flash('errorMessage', error.details)
        res.redirect('/voters')
      } else {
        const isVoterExist = await getSingleVoter(value.nim, 'findbynim')

        if (isVoterExist) {
          req.flash('errorMessage', 'voter is exist!')
        } else {
          await addVoter(value, req.file)
          req.flash('successMessage', `success add new voter : ${value.email}`)
        }
        res.redirect('/voters')
      }
    }
  })
})

// voters xlsx file upload
app.post('/voters-file', ensureLoggedIn(), isAdminAllowed, (req, res) => {
  voterFile(req, res, async (err) => {
    if (err) {
      req.flash('errorMessage', 'invalid spreadsheet file!')
      res.redirect('/voters')
    } else {
      const file = XLSX.read(fs.readFileSync('backend/voterFile.xlsx'))
      const data = []
      const temp = XLSX.utils.sheet_to_json(file.Sheets.Sheet1)
      temp.forEach((res) => {
        data.push(res)
      })

      for (let x = 0; x < data.length; x++) {
        const voterTemp = {
          nim: data[x].NIM,
          fullname: data[x].Name,
          email: data[x].Email,
        }

        await addVoter(voterTemp)
      }
      fs.unlinkSync('backend/voterFile.xlsx')
      req.flash('successMessage', `success import voters`)
      res.redirect('/voters')
    }
  })
})

// edit voters
app.put('/voters', ensureLoggedIn(), isAdminAllowed, (req, res) => {
  voterPhoto(req, res, async (err) => {
    if (err) {
      req.flash('errorMessage', 'invalid photo file!')
      res.redirect('back')
    } else {
      const { error, value } = voterValidation(req.body)
      if (error) {
        req.flash('errorMessage', error.details)
        res.redirect('back')
      } else {
        await editVoter(value, req.file)
        req.flash('successMessage', `success edit voter : ${value.nim}`)
        res.redirect('back')
      }
    }
  })
})
/////////////////////////////////////// end of voters ////////////////////////////////////////

//////////////////////////////////////// /// candidates ///////////////////////////////////////////
// get all candidates
app.get('/candidates', ensureLoggedIn(), async (req, res) => {
  const candidate = await getCandidates()
  const user = req.user.username
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')
  const validator = await getValidator()
  const admin = await Admin.findOne({ username: 'admin' })

  res.render('candidates', {
    layout: 'layouts/main-layout',
    title: 'candidates',
    user,
    candidate,
    flashMessage: { errorMessage, successMessage },
    validator,
    adminStatus: admin.candidateAccess,
  })
})

// add candidates
app.post('/candidates', ensureLoggedIn(), isAdminAllowed, (req, res) => {
  // multer upload file foto
  candidatePhoto(req, res, async (err) => {
    if (err) {
      req.flash('message', 'invalid photo file!')
      res.redirect('/candidates')
    } else {
      const { error, value } = candidateValidation(req.body)
      if (error) {
        req.flash('errorMessage', error.details)
        res.redirect('/candidates')
      } else {
        await addCandidate(value, req.file)
        req.flash('successMessage', `success add new candidate : ${value.candidate}`)
        res.redirect('/candidates')
      }
    }
  })
})
/////////////////////////////////////// end of candidates ////////////////////////////////////////

// delete data
app.delete('/:type', ensureLoggedIn(), isAdminAllowed, async (req, res, next) => {
  if (req.params.type === 'voters') {
    await deleteVoter(req.body.nim)
    req.flash('successMessage', `${req.body.nim} deleted`)
    res.redirect('back')
  } else if (req.params.type === 'candidates') {
    const candidate = await getSingleCandidate(req.body.id)
    await deleteCandidate(req.body.id)

    req.flash('successMessage', `candidate ${candidate.candidate} deleted`)
    res.redirect('back')
  } else {
    next()
  }
})

/////////////////// export API ///////////////////

// export data voter/candidate to validator
app.get('/export/:type', tokenValidation, async (req, res) => {
  if (req.params.type === 'voter') {
    const voters = await getVoters(req.query)
    res.json(voters)
  } else if (req.params.type === 'candidate') {
    const candidates = await getCandidates()
    res.json(candidates)
  } else {
    res.send('invalid request')
  }
})

// export a voter to node
app.get('/voter', tokenValidation, async (req, res) => {
  const voter = await getSingleVoter(req.query.nim, 'findbynim')
  
  if (voter !== null) res.json(voter)
  else res.json({ status: 'user not found!' })
})
/////////////////// end export API ///////////////////

// solve error
app.post('/solve/:type', async (req, res) => {
  await solveError(req.body, req.params.type)
  res.redirect(`/${req.params.type}s`)
})

// public page
app.get('/public', async (req, res) => {
  const voters = await getVoters(req.query)
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')

  res.render('public', {
    layout: 'layouts/public-layout',
    title: 'voter list',
    voters,
    flashMessage: { errorMessage, successMessage },
  })
})

app.post('/public', isComplaintAllowed, async (req, res) => {
  const checkComplaint = await isComplaintExist(req.body.email)

  if (checkComplaint !== null) {
    req.flash('errorMessage', 'you are already complained before!')
    res.redirect('/public')
  } else {
    try {
      await receiveComplaint(req.body)
      req.flash('successMessage', `complaint ${req.body.email} sent, please wait for fixes`)
      res.redirect('/public')
    } catch (error) {
      const errorMessage = [error.errors.email.message, error.errors.comment.message]
      req.flash('errorMessage', errorMessage)
      res.redirect('/public')
    }
  }
})

// complaint page
app.get('/complaints', ensureLoggedIn(), async (req, res) => {
  const complaints = await getComplaints(req.query)
  const user = req.user.username
  const successMessage = req.flash('successMessage')
  const errorMessage = req.flash('errorMessage')

  res.render('complaints', {
    layout: 'layouts/main-layout',
    title: 'complaint page',
    complaints,
    user,
    flashMessage: { errorMessage, successMessage },
  })
})

app.post('/complaints', ensureLoggedIn(), async (req, res) => {
  try {
    await solveComplaint(req.body)
    req.flash('successMessage', `complaint ${req.body.email} solved`)
    res.redirect('/complaints')
  } catch (error) {
    res.send(error)
  }
})
// end complaint page

// voter/admin forgot password
app.get('/forgot-password', (req, res) => {
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')

  res.render('auth/forgot-password', {
    layout: 'layouts/auth-layout',
    flashMessage: { errorMessage, successMessage },
    title: 'voter/admin forgot password',
  })
})

app.post('/forgot-password', async (req, res) => {
  const isEmailAvailable = await sendResetKey(req.body.email)

  if (isEmailAvailable) {
    req.flash('successMessage', `password reset key sent to ${req.body.email}`)
    res.redirect('/forgot-password')
  } else {
    req.flash('errorMessage', `email ${req.body.email} not found`)
    res.redirect('/forgot-password')
  }
})

app.get('/reset-password', (req, res) => {
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')

  res.render('auth/reset-password', {
    layout: 'layouts/auth-layout',
    flashMessage: { errorMessage, successMessage },
    title: 'voter/admin reset password',
  })
})

app.post('/reset-password', async (req, res) => {
  const account = await resetKeyValidation(req.body.reset_key)
  if (account !== null) {
    res.render('auth/reset-password-2', {
      layout: 'layouts/auth-layout',
      title: 'reset password',
      account,
    })
  } else {
    req.flash('errorMessage', 'invalid reset key code!')
    res.redirect('/reset-password')
  }
})

app.post('/reset-password-2', async (req, res) => {
  try {
    await resetPassword(req.body)
    req.flash('successMessage', `${req.body.email} password updated`)
  } catch (error) {
    req.flash('errorMessage', 'reset password failed!')
  }
  res.redirect('/reset-password')
})
// end voter forgot password

// admin change password
app.post('/change-password', async (req, res) => {
  if (req.body.newPassword === '') {
    req.flash('errorMessage', 'new password must be filled!')
    res.redirect('back')
  } else if (req.body.newPassword.length < 5) {
    req.flash('errorMessage', 'new password must be at least 5 characters!')
    res.redirect('back')
  } else {
    const admin = await Admin.findByUsername(req.body.username)

    try {
      await admin.changePassword(req.body.currentPassword, req.body.newPassword)
      req.flash('successMessage', 'password successfully changed')
      res.redirect('/logout')
    } catch (error) {
      req.flash('errorMessage', 'incorrect current password!')
      res.redirect('back')
    }
  }
})

// certbot
app.get('/.well-known/acme-challenge/XgQ1SnUlKcDj9rrcdm7Q8hD7TeL2cbcv6IzYZ6MqZP8', (req, res) => {
  res.sendFile(`./public/.well-known/acme-challenge/XgQ1SnUlKcDj9rrcdm7Q8hD7TeL2cbcv6IzYZ6MqZP8.yDG055r0ZLJ6JVpmYMbqtzaIAUIicx4iofWyTFNSd4w`)
})

// page not found
app.use((req, res) => {
  res.status(404)
  res.render('404', {
    layout: '404',
    title: 'Page not found!',
  })
})

// listen on defined port
app.listen(process.env.HTTP_PORT, () => {
  console.log(`EvB Admin listening on port http://localhost:${process.env.HTTP_PORT}/`)
})

// create admin account for the first time
// delete unused photo
;(async () => {
  removeUnusedPhoto()
  createAccount(process.env.USERNAME_ADMIN, process.env.EMAIL_ADMIN)
})()
