'use strict'

class categoryRegister {
  get rules() {
    return {
      type: 'required',
      name: 'required|min:3',
    }
  }

  get messages() {
    return {
      'type.required': 'O tipo é obrigatório!',
      'type.required': 'O Nome não é válido!',
      'type.min': 'O Nome não é válido!',
    }
  }
}

module.exports = categoryRegister
