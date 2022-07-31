import express, { urlencoded } from 'express'
import session from 'express-session'
import dotenv from 'dotenv'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import flash from 'connect-flash'
import bcrypt from 'bcryptjs'
import { net } from './p2p.js'
import expressLayouts from 'express-ejs-layouts'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { getBlocks, newBlock, isVoted, getBlock, getCandidatesRecap } from './blockchain.js'
import { getCandidates, getVoterPasswd, getVoterPubKey, getVoter } from './getAPI.js'
import { verify, importRsaKey } from './verification.js'
dotenv.config({ path: './config/.env' })

const app = express()
  .use(urlencoded({ extended: true }))
  .set('view engine', 'ejs')
  .use(expressLayouts)
  .use(express.static('public'))
  .use(
    session({
      cookie: { maxAge: 1000 * 60 * 60 },
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

passport.serializeUser((user, done) => {
  done(null, user)
})
passport.deserializeUser((user, done) => {
  done(null, user)
})
const httpServer = createServer(app)
const io = new Server(httpServer)
export { io }

// p2p mesh network
await net.join()

// pagination method
const paginator = (array, queryPage, queryLimit) => {
  let page = Number(queryPage),
    limit = Number(queryLimit),
    offset = (page - 1) * limit,
    paginatedItems = array.slice(offset).slice(0, queryLimit),
    totalPages = Math.ceil(array.length / limit)

  return {
    page: page,
    limit: limit,
    hasPrevPage: page - 1 ? true : false,
    hasNextPage: totalPages > page ? true : false,
    total: array.length,
    totalPages: totalPages,
    data: paginatedItems,
  }
}

// passport
passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'nim',
      passwordField: 'password',
    },
    async (nim, password, done) => {
      const voterPassword = await getVoterPasswd(nim)

      if (voterPassword === null || voterPassword === undefined) {
        return done(null, false)
      }

      const isMatch = bcrypt.compareSync(password, voterPassword)
      if (isMatch) {
        return done(null, nim)
      } else {
        return done(null, false)
      }
    }
  )
)

// if voter already voting, redirect to myvote
const isVoterVoted = async (req, res, next) => {
  const voter = await getVoter(req.user)
  if (isVoted(voter._id)) {
    req.flash('errorMessage', 'You were already vote!')
    res.redirect('/myvote')
  } else {
    next()
  }
}

// if voter has not logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.redirect('login')
  }
}

// if voter already logged in, redirect to homepage
// for login page purpose only
const hasLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect('/')
  } else {
    next()
  }
}

// login
app.get('/login', hasLoggedIn, async (req, res) => {
  const errorMessage = req.flash('messageFailure')
  const successMessage = req.flash('messageSuccess')

  res.render('auth/login', {
    layout: 'auth/login',
    flashMessage: { errorMessage, successMessage },
  })
})

app.post(
  '/login',
  passport.authenticate('local-login', {
    failureRedirect: '/login',
    failureFlash: {
      type: 'messageFailure',
      message: 'wrong nim or password or password unset!',
    },
    successRedirect: '/',
  }),
  (req, res) => {}
)

// logout
app.get('/logout', (req, res) => {
  req.logout()
  req.flash('messageSuccess', 'Logged out')
  res.redirect('login')
})

// route homepage
app.get('/', (req, res) => {
  res.redirect('/profile')
})

// route untuk daftar blockchain
app.get('/blocks', isLoggedIn, (req, res) => {
  // if query is empty, then add default query
  if (Object.keys(req.query).length === 0) {
    req.query = {
      limit: 5,
      page: 1,
    }
  }

  const blocks = getBlocks()
  const result = paginator(blocks, req.query.page, req.query.limit)
  const user = req.user

  res.render('blocks', {
    layout: 'layouts/main-layout',
    title: 'Blocks',
    user,
    blocks: result,
  })
})

// profile page
app.get('/profile', isLoggedIn, async (req, res) => {
  const voter = await getVoter(req.user)
  const user = req.user

  res.render('profile', {
    layout: 'layouts/main-layout',
    title: 'My Profile',
    user,
    voter,
  })
})

// form vote
app.get('/vote', isLoggedIn, isVoterVoted, async (req, res) => {
  const candidate = await getCandidates()
  const voter = await getVoter(req.user)
  const user = req.user

  res.render('vote', {
    layout: 'layouts/main-layout',
    title: 'Vote Now!',
    user,
    candidate,
    voter,
  })
})

// post form voting
// cek apakah signature terverifikasi
// cek apakah voter sudah melakukan voting
app.post('/vote', isLoggedIn, async (req, res) => {
  const voterPubkey = await getVoterPubKey(req.user)
  const pubkey = await importRsaKey(voterPubkey)
  const isVerified = await verify(pubkey, req.body.signature, req.body.candidateID)

  if (isVerified) {
    if (!isVoted(req.body.voterID)) {
      newBlock(req.body)
      req.flash('successMessage', 'voting success!')
      res.redirect('/myvote')
    } else {
      req.flash('errorMessage', 'you were already vote!')
      res.redirect('/vote')
    }
  } else {
    req.flash('errorMessage', 'voting error!')
    res.redirect('/vote')
  }
})

// halaman my vote
app.get('/myvote', isLoggedIn, async (req, res) => {
  const voter = await getVoter(req.user)
  const voting = getBlock(voter._id)
  const successMessage = req.flash('successMessage')
  const errorMessage = req.flash('errorMessage')
  const user = req.user

  res.render('myvote', {
    layout: 'layouts/main-layout',
    title: 'My Vote',
    user,
    voting,
    flashMessage: { successMessage, errorMessage },
  })
})

// halaman rekapitulasi
app.get('/recap', isLoggedIn, async (req, res) => {
  const recap = await getCandidatesRecap()
  const user = req.user

  res.render('recap', {
    layout: 'layouts/main-layout',
    title: 'Recapitulation',
    user,
    recap,
  })
})

// list nodes
app.get('/nodes', isLoggedIn, (req, res) => {
  const user = req.user
  const nodes = net.nodes
  const thisNode = net.networkId

  res.render('nodes', {
    layout: 'layouts/main-layout',
    title: 'Node List',
    user,
    nodes,
    thisNode,
  })
})

// public page
app.get('/public', async (req, res) => {
  const recap = await getCandidatesRecap()
  const nodes = net.nodes
  const thisNode = net.networkId
  // if query is empty, then add default query
  if (Object.keys(req.query).length === 0) {
    req.query = {
      limit: 5,
      page: 1,
    }
  }

  const allBlocks = getBlocks()
  const result = paginator(allBlocks, req.query.page, req.query.limit)
  const voters = await getVoter()

  res.render('public', {
    layout: 'public',
    recap,
    nodes,
    thisNode,
    blocks: result,
    voters,
  })
})

// route untuk page not found
app.use((req, res) => {
  res.status(404)
  res.render('404', {
    layout: '404',
    title: '404 : page not found',
  })
})

// running server
httpServer.listen(process.env.HTTP_PORT, () => {
  console.log(`EvB-node listening on port : http://localhost:${process.env.HTTP_PORT}/`)
})
