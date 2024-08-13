'use strict'

class profileStep1 {
  get rules () {
    return {
      name: 'required',
      slug: 'required|unique:profiles,slug',
      whatsapp: 'required|min:13',
      // minval: 'required|number',
    }
  }

  get messages () {
    return {
      'name.required': 'O Nome não é válido!',
      'slug.required': 'O endereço não é válido!',
      'slug.unique': 'O endereço não está disponível!',
      'whatsapp.required': 'O número não é válido!',
      'whatsapp.min': 'O número não é válido!',
      // 'minval.required': 'O valor não é válido!',
      // 'minval.number': 'O valor não é válido!',
    }
  }
}

module.exports = profileStep1
