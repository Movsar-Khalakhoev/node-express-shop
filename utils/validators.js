const {body} = require('express-validator/check')
const User = require('../models/user')

exports.registerValidators = [
  body('email')
    .isEmail()
    .withMessage('Введите коррекный email')
    .custom(async (value, {req}) => {
      try {
        const user = await User.findOne({email: value})

        if (user) {
          return Promise.reject('Такой email уже зарегистрирован')
        }
      } catch (e) {
        console.log(e)
      }
    })
    .normalizeEmail()
    .trim(),
  body('password', 'Длина пароля от 6 до 56 символов')
    .isLength({min: 6, max: 56})
    .isAlphanumeric()
    .trim(),
  body('confirm')
    .custom((value, {req}) => {
      if (value !== req.body.password) {
        throw new Error('Пароли должны совпадать')
      } else return true
    })
    .trim(),
  body('name')
    .isLength({min: 3})
    .withMessage('Имя должно быть не короче 3 символов')
    .trim()
]

exports.courseValidators = [
  body('title')
    .isLength({min: 3})
    .withMessage('Минимальная длина названия - 3 символа')
    .trim(),
  body('price')
    .isNumeric()
    .withMessage('Введите корректную цену')
    .trim(),
  body('img')
    .isURL()
    .withMessage('Введите корректный url картинки')
    .trim()
]
