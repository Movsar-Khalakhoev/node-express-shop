const keys = require('../keys')

module.exports = function(email) {
  return {
    to: email,
    from: keys.EMAIL_FROM_LOGIN,
    subject: 'Аккаунт создан',
    html: `
      <p>Эг1 1ачдаь письмо да ер, старый.</p>
      <p>Хьа email ер да хьона - ${email}. Д1алацлахь яяя</p>
      <p>Ер тха ший мо кхы доац сайт да яяя - ${keys.BASE_URL}</p>
    `
  }
}
