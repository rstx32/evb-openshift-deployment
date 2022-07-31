import express from 'express'
import dotenv from 'dotenv'
import expressLayouts from 'express-ejs-layouts'
import passport from 'passport'
import session from 'express-session'
import connectEnsureLogin from 'connect-ensure-login'
import flash from 'connect-flash'
import { getCandidates, getVoters } from './getAPI.js'
import {
  getValidator,
  getSingleValidator,
  validate,
  acceptSolve,
  checkComplaint,
  createAccount,
  sendResetKey,
  resetPassword,
} from './db.js'
import Validator from './model/validator.js'
dotenv.config({ path: 'backend/config/.env' })

const app = express()
  .set('view engine', 'ejs')
  .use(express.urlencoded({ extended: false }))
  .use(expressLayouts)
  .use(express.static('public'))
  .use(
    session({
      cookie: { maxAge: 1000 * 60 * 60},
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

passport.use(Validator.createStrategy())
passport.serializeUser(Validator.serializeUser())
passport.deserializeUser(Validator.deserializeUser())

// auth
app.get(
  '/login',
  (req, res, next) => {
    if (req.isAuthenticated()) res.redirect('/')
    else next()
  },
  (req, res) => {
    const errorMessage = req.flash('errorMessage')
    const successMessage = req.flash('successMessage')

    res.render('auth/login', {
      layout: 'layouts/auth-layout',
      title: 'EvB-validator Login',
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
    successRedirect: '/',
  }),
  (req, res) => {}
)

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/login')
})
// end auth

// root page
app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.redirect('/voters')
})

// voters
app.get('/voters', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const user = req.user
  const voters = await getVoters(req.query, user._id)
  const validator = await getSingleValidator(user._id, 'findbyid')
  const errorMessage = req.flash('errorMessage')
  const isComplaintExist = await checkComplaint()

  res.render('voters', {
    layout: 'layouts/main-layout',
    title: 'voters',
    voters,
    user,
    validator,
    errorMessage,
    isComplaintExist,
  })
})

// candidates
app.get('/candidates', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const user = req.user
  const candidates = await getCandidates(user._id)
  const validator = await getSingleValidator(user._id, 'findbyid')
  const errorMessage = req.flash('errorMessage')

  res.render('candidates', {
    layout: 'layouts/main-layout',
    title: 'candidates',
    candidates,
    user,
    validator,
    errorMessage,
  })
})

// validator
app.get('/validator', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const validator = await getValidator()
  const user = req.user
  const errorMessage = req.flash('errorMessage')

  res.render('validator', {
    layout: 'layouts/main-layout',
    title: 'validator',
    validator,
    user,
    errorMessage,
  })
})

// validation
app.post('/validate/:type', async (req, res, next) => {
  const isComplaintExist = await checkComplaint()
  if (req.params.type === 'voter' && isComplaintExist.length > 0) {
    req.flash('errorMessage', 'complaint still exist, wait for admin solve')
    res.redirect('back')
  } else {
    if (req.params.type === 'voter' || req.params.type === 'candidate') {
      await validate(req.body, req.params.type)
      res.redirect('back')
    } else {
      res.redirect(next)
    }
  }
})

// accept solve
app.post('/solve/:type', async (req, res, next) => {
  if (req.params.type === 'voter' || req.params.type === 'candidate') {
    await acceptSolve(req.body, req.params.type)
    res.redirect('back')
  } else {
    res.redirect(next)
  }
})

// validator change password
app.post('/change-password', async (req, res) => {
  const getValidator = await getSingleValidator(req.body.validatorID, 'findbyid')
  const validator = await Validator.findByUsername(getValidator.username)

  try {
    await validator.changePassword(req.body.currentPassword, req.body.newPassword)
    req.flash('successMessage', 'password successfully changed')
    res.redirect('/logout')
  } catch (error) {
    req.flash('errorMessage', 'incorrect current password!')
    res.redirect('back')
  }
})

// validator forgot password
app.get('/forgot-password', (req, res) => {
  const errorMessage = req.flash('errorMessage')
  const successMessage = req.flash('successMessage')

  res.render('auth/forgot-password', {
    layout: 'layouts/auth-layout',
    flashMessage: { errorMessage, successMessage },
    title: 'validator forgot password',
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
    title: 'validator reset password',
  })
})

app.post('/reset-password', async (req, res) => {
  const validator = await getSingleValidator(req.body.reset_key, 'findbyresetkey')

  if (validator !== null) {
    res.render('auth/reset-password-2', {
      layout: 'layouts/auth-layout',
      title: 'reset password',
      validator,
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

// page not found
app.use((req, res) => {
  res.status(404)
  res.render('404', {
    layout: '404',
    title: 'Page not found!',
  })
})

app.listen(process.env.HTTP_PORT, () => {
  console.log(`EvB validator listening on http://localhost:${process.env.HTTP_PORT}`)
})

// create validator account for the first time
;(() => {
  const list = process.env.ACCOUNT.split(' ')
  for (let index = 0; index < list.length; index += 2) {
    createAccount(list[index], list[index + 1])
  }
})()
