'use strict'
const _ = require('lodash')
const User = use('App/Model/User')
const Hash = use('Hash')
const Validator = use('Validator')
const MailGun = require('../../../Serializers/MailGun');

class AuthController {

  * register(req, res) {
    const validation = yield Validator.validateAll(req.all())

    if (validation.fails()) {
      return res.json({ status: false, message: validation.messages() })
    }
    let mobile = req.input('mobile', '')
    let email = req.input('email', '')
    const user = yield User.findOne({ $or:[{'email':email}, {'mobile':mobile} ]})
    if (user) {
      return res.json({ status: false, messageCode: "USER_ALREADY_EXIST"})
    } else {
      let user = yield User.create({
        mobile: mobile,
        fullname: req.input('fullname', ''),
        email: email,
        password: yield Hash.make(req.input('password'))
      })
      user.emailToken = yield Hash.make(user.email)
      user.save()
      MailGun.sendVerification(user, req)
    }
    return res.json({ status: true, messageCode: 'EMAIL_VERIFY' })
  }


  * deviceLogin (req, res) {
    const validation = yield Validator.validateAll(req.all(), { id: 'required', type: 'required' })

    if (validation.fails()) {
      return res.json({ message: validation.messages() })
    } else {

      if (auth) {
        return res.json({ status: true, user: auth, token: auth.token.token })
      } else {
        return res.json({ status: false, messageCode: 'USER_NOT_FOUND' })
      }

    }
  }

  * login (req, res) {
    const validation = yield Validator.validateAll(req.all(), User.loginRules)
    if (validation.fails()) {
      return res.json({ message: validation.messages() })
    } else {
      const auth = yield req.jwt.auth(req)
      if (auth) {
        return res.json({ status: true, messageCode: 'LOGIN_SUCCESS', token: auth.token.token })
      } else {
        return res.json({ status: false, messageCode: 'USER_NOT_FOUND' })
      }

    }
  }

  * confirm (req, res) {
    let user = yield User.findOne({ email: req.input('email', '') })
    if (user) {
      if (user.verified) {
        yield req.jwt.generateToken(user)
        res.json({ status: true, messageCode: 'VERIFIED_EMAIL', token: user.token.token })
      }
    } else {
      res.json({ status: false, messageCode: 'NOT_FOUND' })
    }
  }

  * current (req, res) {
    return res.json({ status: true, messageCode: 'SUCCESS', data: req.user })
  }

}

module.exports = AuthController
