const {Router} = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const {validationResult} = require('express-validator/check')
const {registerValidators} = require('../utils/validators')
const nodemailer = require('nodemailer')
const keys = require('../keys')
const registrationEmail = require('../emails/registration')
const resetEmail = require('../emails/reset')
const User = require('../models/user')
const router = Router()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: keys.EMAIL_FROM_LOGIN,
    pass: keys.EMAIL_FROM_PASSWORD
  }
})

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  })
})

router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body

    const candidate = await User.findOne({email})

    if (candidate) {
      const areSame = await bcrypt.compare(password, candidate.password)

      if (areSame) {
        req.session.user = candidate
        req.session.isAuthenticated = true
        req.session.save(err => {
          if (err) throw err
          res.redirect('/')
        })
      } else {
        req.flash('loginError', 'Неверный пароль')
        res.redirect('/auth/login#login')
      }
    } else {
      req.flash('loginError', 'Такого пользователя не существует')
      res.redirect('/auth/login#login')
    }
  } catch (e) {
    console.log(e)
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'))
})

router.post('/register', registerValidators, async (req, res) => {
  try {
    const {email, password, name} = req.body
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('registerError', errors.array()[0].msg)
      return res.status(422).redirect('/auth/login#register')
    }

    const hashPassword = await bcrypt.hash(password, 10)
    const user = new User({
      email, name, password: hashPassword, cart: {items: []}
    })
    await user.save()
    res.redirect('/auth/login#login')
    await transporter.sendMail(registrationEmail(email))
  } catch (e) {
    console.log(e)
  }
})

router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Восстановление пароля',
    error: req.flash('error')
  })
})

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('error', 'Что-то пошло не так, повторите позже')
        return res.redirect('/auth/reset')
      }

      const token = buffer.toString('hex')
      const candidate = await User.findOne({email: req.body.email})

      if (candidate) {
        candidate.resetToken = token
        candidate.resetTokenExp = Date.now() + 60*60*1000
        await candidate.save()
        await transporter.sendMail(resetEmail(candidate.email, token))
        res.redirect('/auth/login')
      } else {
        req.flash('error', 'Такого email нет')
        res.redirect('/auth/reset')
      }
    })
  } catch (e) {
    console.log(e)
  }
})

router.get('/password/:token', async (req, res) => {
  const token = req.params.token
  if (!token) {
    return res.redirect('/auth/login')
  }
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExp: {$gt: Date.now()}
    })

    if (!user) {
      return res.redirect('/auth/login')
    } else {
      res.render('auth/password', {
        title: 'Восстановление пароля',
        error: req.flash('error'),
        userId: user._id.toString(),
        token
      })
    }
  } catch (e) {
    console.log(e)
  }



})

router.post('/password', async (req, res) => {
  const {userId, token, password} = req.body
  try {
    const user = await User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExp: {$gt: Date.now()}
    })

    if (user) {
      user.password = await bcrypt.hash(password, 10)
      user.resetToken = undefined
      user.resetTokenExp = undefined
      await user.save()
      res.redirect('/auth/login')
    } else {
      req.flash('error', 'Время жизни токена истекло')
      res.redirect('/auth/login')
    }
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
