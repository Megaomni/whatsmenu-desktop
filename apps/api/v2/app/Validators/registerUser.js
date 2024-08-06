'use strict'

class registerUser {
  get rules () {
    return {
      name: 'required',
      secretNumber: 'required|min:14',
      email: 'required|email|unique:users',
      whatsapp: 'required',
      password: 'required|min:6'
    }
  }

  get messages () {
    return {
      'name.required': 'o nome não é válido',
      'secretNumber.required': 'o CPF não é válido',
      'secretNumber.min': 'o CPF não é válido',
      'email.required': 'o e-mail não é válido',
      'email.email': 'o e-mail não é válido',
      'email.unique': 'Esse e-mail já está cadastrado!',
      'whatsapp.required': 'o número não é válido',
      'password.required': 'a senha precisa ter pelo menos 6 caracteres',
      'password.min': 'a senha precisa ter pelo menos 6 caracteres'
    }
  }
}

module.exports = registerUser
