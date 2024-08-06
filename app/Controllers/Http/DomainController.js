'use strict'

const User = use('App/Models/User')
const Domain = use('App/Models/Domain')

const Env = use('Env')
const Utility = use('Utility')

const axios = require('axios')

const headers = {
  "headers": {
    'x-auth-key': Env.get('CLOUD_FLARE_API_KEY'),
    'x-auth-email': Env.get('CLOUD_FLARE_API_USERNAME')
  }
}

class DomainController {

  async addRegisterDNS(key, type, name, content, priority = 10, proxied = true) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 22, metodo: 'addRegisterDNS' })
      await axios.post(`https://api.cloudflare.com/client/v4/zones/${key}/dns_records`, {
        "type": type,
        "name": name.replace(/(^[^\.]*)(\.)/, '').trim(),
        "content": content,
        "priority": priority,
        "proxied": proxied,
      }, headers)
    } catch (error) {
      console.error(error)
      throw error.response.data
    }
  }

  async index({ response, view, auth }) {
    console.log('Starting: ', { controller: 'DomainController', linha: 37, metodo: 'index' })
    const user = await User.find(auth.user.id)
    const profile = await user.profile().fetch()
    const sysreq = await user.requests().where('status', 'pending').last()
    const prof = profile.toJSON()
    const domains = await Domain.findBy('profileId', prof.id)

    const deliveryAccess = await Utility.ControlAccess(user)

    if (!JSON.parse(deliveryAccess)) {
      return response.redirect('back')
    }

    return response.send(
      view.render('inner.domains.index', {
        profile: prof,
        domains: domains,
        systemRequest: sysreq ? sysreq.toJSON() : null
      })
    )
  }
  async storeDomain({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 60, metodo: 'storeDomain' })
      const data = request.except(['_csrf'])
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()

      data.profileId = profile.id

      const cloudFlareAPI = await axios.post('https://api.cloudflare.com/client/v4/zones', {
        "name": data.name,
        "account": {
          "id": Env.get('CLOUD_FLARE_API_ACCOUNT_ID')
        },
        "jump_start": true,
        "type": "full"
      }, headers)

      data.key = cloudFlareAPI.data.result.id

      domains.toJSON().length == 0 ? data.default = 1 : data.default = 0

      await Domain.create(data)

      await axios.patch(`https://api.cloudflare.com/client/v4/zones/${data.key}/settings/always_use_https`, {
        "value": "on"
      }, headers)
      await axios.patch(`https://api.cloudflare.com/client/v4/zones/${data.key}/settings/automatic_https_rewrites`, {
        "value": "on"
      }, headers)
      await axios.patch(`https://api.cloudflare.com/client/v4/zones/${data.key}/settings/ssl`, {
        "value": "full"
      }, headers)

      const domainsResponse = await profile.domains().fetch()


      const regex = /.+(\..+)$/gm
      let domainArr
      while ((domainArr = regex.exec(domainsResponse.toJSON()[domainsResponse.toJSON().length - 1].name)) !== null) {
        if (domainArr.index === regex.lastIndex) {
          regex.lastIndex++
        }
        //.cf, .ga, .gq, .ml, or .tk
        if (domainArr[1] == '.cf' || domainArr[1] == '.ga' || domainArr[1] == '.gq' || domainArr[1] == '.ml' || domainArr[1] == '.tk') {
          const domainsUpdated = await profile.domains().fetch()
          return response.json(domainsUpdated)
        }

      }

      await this.addRegisterDNS(data.key, 'A', '@', Env.get('WHATSMENU_IP'))
      await this.addRegisterDNS(data.key, 'CNAME', 'www', data.name)

      const domainsUpdated = await profile.domains().fetch()

      return response.json(domainsUpdated)
    } catch (error) {
      console.error(error.response.data);
      return response.json(error.response.data)
    }

  }

  async storeDnsConfig({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 125, metodo: 'storeDnsConfig' })

      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()
      const data = request.except(['_csrf'])
      const domainsJSON = domains.toJSON()

      let proxied = true

      if (data.typeDns === "TXT" || data.typeDns === "MX") {
        proxied = false
      }

      const filteredDomain = domainsJSON.find(domain => domain.id == data.domainId)
      await this.addRegisterDNS(filteredDomain.key, data.typeDns, data.nameDns, data.contentDns, data.priority, proxied)

      return response.json(domains)
    } catch (error) {
      console.error(error.errors)
      throw error
    }
  }

  async updateDomain({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 152, metodo: 'updateDomain' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()
      const data = request.except(['_csrf'])
      let domainsJSON = domains.toJSON()

      const domainId = domainsJSON[data.id]

      await Domain.query().where('profileId', profile.id).update({ default: '0' })

      const domain = await Domain.find(domainId.id)
      domain.merge({ default: 1 })
      await domain.save()

      const domainsUpdated = await profile.domains().fetch()

      return response.json(domainsUpdated)
    } catch (error) {
      console.error(error.response.data)
      throw error.response.data
    }
  }

  async getDomains({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 178, metodo: 'getDomains' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()

      return response.json(domains)
    } catch (error) {
      console.error(error.response.data)
      throw error.response.data
    }
  }

  async getDefaultDomain({ auth, response }) {
    try {
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()

      if (profile) {
        const domains = await profile.domains().fetch()
        const defaultDomain = domains.toJSON().find(domain => domain.default)

        if (defaultDomain) {
          return response.json(defaultDomain.name)
        }
      }

      return response.json(null)
    } catch (error) {
      console.error(error);
      throw error
    }
  }

  async getDnsRecords({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 192, metodo: 'getDnsRecords' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()
      const data = request.except(['_csrf'])

      const domainsJSON = domains.toJSON()

      const haveDomain = domainsJSON.find(domain => domain.id === data.domainId)
      if (haveDomain && haveDomain.key) {
        const domainDNS = await axios.get(`https://api.cloudflare.com/client/v4/zones/${haveDomain.key}/dns_records`, headers)
        const dns = domainDNS.data.result.map(dr => {
          if (dr.type === "A") {
            dr.content = "127.0.0.1"
          }
          return dr
        })
        return response.json(dns)
      }
      return response.json({ dns: [] })
    } catch (error) {
      console.error(error)
      throw error.response.data
    }
  }

  async deleteDomain({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 222, metodo: 'deleteDomain' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const domains = await profile.domains().fetch()
      const data = request.except(['_csrf'])
      const domainsJSON = domains.toJSON()

      const filteredDomain = domainsJSON.find(domain => domain.id == data.domainId)

      await axios.delete(`https://api.cloudflare.com/client/v4/zones/${filteredDomain.key}`, headers)

      const domain = await Domain.find(filteredDomain.id)

      await domain.delete()

      return response.json({ message: "success" })
    } catch (error) {
      console.error(error.response.data)
      throw error.response.data
    }
  }

  async deleteDnsConfig({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'DomainController', linha: 248, metodo: 'deleteDnsConfig' })
      const data = request.except(['_csrf'])

      await axios.delete(`https://api.cloudflare.com/client/v4/zones/${data.zone_id}/dns_records/${data.id}`, headers)

      return response.json({ message: "success" })
    } catch (error) {
      console.error(error.response.data)
      throw error.response.data
    }
  }
}

module.exports = DomainController
