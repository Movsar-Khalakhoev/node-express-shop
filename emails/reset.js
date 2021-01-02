const keys = require('../keys')

module.exports = function(email, token) {
  return {
    to: email,
    from: keys.EMAIL_FROM_LOGIN,
    subject: 'Восстановление доступа',
    html: `
      <p>Ей, вале лорашк дарб дейт хьайн.</p>
      <p>Ма дик дицдаьд 1а из пароль.</p>
      <p>Укх ссылка т1а да г1ол х1анз:</p>
      <p><a href="${keys.BASE_URL}/auth/password/${token}">Восстановить доступ</a></p>
    `
  }
}
