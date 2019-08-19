const request = require(`request`)
const rp = require(`request-promise`)

const apis = require(`./apis`)
const Util = require(`./Util`)
const Cognito = require(`./Cognito`)
const Oauth2 = require(`./Oauth2`)

class Request {
  static _auth(conf = {}, cb) {
    let tokens = Cognito.getCache(conf)
    let headers = {}
    if (tokens != null) {
      headers[`Authorization`] = tokens.id_token
      conf.id_token = tokens.id_token
      conf.refresh_token = tokens.refresh_token
      conf.token_source = `cache`
      cb(headers)
    } else if (tokens == null && conf.password == undefined) {
      throw Error(`password is required`)
    } else {
      Cognito.getTokens(conf, tokens => {
        if (tokens == null) {
          throw Error(`the wrong username or password`)
        } else {
          headers[`Authorization`] = tokens.id_token
          conf.id_token = tokens.id_token
          conf.refresh_token = tokens.refresh_token
          conf.token_source = `cognito`
          cb(headers)
        }
      })
    }
  }

  static auth(conf = {}, cb) {
    let headers = {}
    if (apis[conf.path_name][conf.method || `get`].auth !== true) {
      cb(headers)
    } else if (conf.id_token != undefined) {
      headers[`Authorization`] = conf.id_token
      conf.token_source = `user`
      cb(headers)
    } else {
      if (conf.username == undefined) {
        throw Error(`username is required`)
      } else {
        if (conf.refresh_token != undefined) {
          Cognito.refreshToken(conf, tokens => {
            if (tokens != null) {
              headers[`Authorization`] = tokens.id_token
              conf.id_token = tokens.id_token
              conf.refresh_token = tokens.refresh_token
              conf.token_source = `cognito`
              cb(headers)
            } else {
              Request._auth(conf, cb)
            }
          })
        } else {
          Request._auth(conf, cb)
        }
      }
    }
  }

  static async authP(conf = {}) {
    let headers = {}
    if (apis[conf.path_name][conf.method || `get`].auth === true) {
      if (conf.id_token != undefined) {
        headers[`Authorization`] = conf.id_token
        conf.token_source = `user`
      } else {
        if (conf.username == undefined) {
          throw Error(`username is required`)
        } else {
          let tokens, token_source
          if (conf.refresh_token != undefined) {
            tokens = await Cognito.refreshTokenP(conf)
            token_source = `cognito`
          }
          tokens = tokens || Cognito.getCache(conf)
          if (tokens != null) {
            headers[`Authorization`] = tokens.id_token
            conf.id_token = tokens.id_token
            conf.refresh_token = tokens.refresh_token
            conf.token_source = token_source || `cache`
          } else if (tokens == null && conf.password == undefined) {
            throw Error(`password is required`)
          } else {
            let tokens = await Cognito.getTokensP(conf)
            if (tokens == null) {
              throw Error(`the wrong username or password`)
            } else {
              headers[`Authorization`] = tokens.id_token
              conf.id_token = tokens.id_token
              conf.refresh_token = tokens.refresh_token
              conf.token_source = `cognito`
            }
          }
        }
      }
    }
    return headers
  }

  static oauth(conf = {}, cb) {
    let headers = {}

    const isRead = apis[conf.path_name][conf.method || `get`].read || false
    const isWrite = apis[conf.path_name][conf.method || `get`].write || false
    const scope = conf.scope || `read`
    if (!(isRead || isWrite)){
      throw Error('[OAuth] this end point is not allowed for oauth')
    } else if (scope === 'read' && !isRead){
      throw Error('[OAuth] this end point requires "write" scope')
    }
    if (conf.access_token != undefined){
      headers['Authorization'] = conf.access_token
      conf.token_source = `oauth2`
      cb(headers)
    } else if (conf.refresh_token != undefined){
      Oauth2.refreshToken(conf, refresh_tokens => {
        if (refresh_tokens != null) {
          headers[`Authorization`] = refresh_tokens.access_token
          conf.access_tolen = refresh_tokens.access_token
          conf.refresh_token = refresh_tokens.refresh_token
          conf.token_source = `oauth2-refresh`
          cb(headers)
        } else {
          throw Error('[OAuth] refresh_token may not be valid')
        }
      })
    } else {
      throw Error(`[Oauth] found neither access_token nor refresh_token`)
    }
  }

  static async oauthP(conf = {}) {
    let headers = {}

    const isRead = apis[conf.path_name][conf.method || `get`].read || false
    const isWrite = apis[conf.path_name][conf.method || `get`].write || false
    const scope = conf.scope || `read`
    if (!(isRead || isWrite)){
      throw Error('[OAuth] this end point is not allowed for oauth')
    } else if (scope === 'read' && !isRead){
      throw Error('[OAuth] this end point requires "write" scope')
    }

    if (conf.access_token != undefined) {
      headers[`Authorization`] = conf.access_token
      conf.token_source = `oauth2`
    } else if (conf.refresh_token != undefined) {
      refresh_tokens = Oauth2.refreshTokenP(conf)
      token_source = `oauth2-refresh`
      if (refresh_tokens != null) {
        headers[`Authorization`] = refresh_tokens.access_token
        conf.access_token = refresh_tokens.access_token
        conf.refresh_token = refresh_tokens.refresh_token
        conf.token_source = `oauth2-refresh`
      } else {
        throw Error(`[OAuth] refresh_token may not be valid`)
      }
    } else {
      throw Error(`[OAuth] found neither access_token nor refresh_token`)
    }

    return headers
  }

  static request(url, opts = {}, conf = {}, cb) {
    let method = conf.method || `get`
    const isOauth = conf.isOauth || false
    if (isOauth) {
      this.oauth(conf, headers => {
        if (conf.access_token != undefined) {
          headers[`Authorization`] = conf.access_token
        } else {
          throw Error(`[OAuth] access_token is required`)
        }
        Util.addHeaders(headers, opts, conf)
        let options = {
          url: url.toString(),
          headers: headers
        }
        Util.addBody(options, opts, conf)
        return request[method](options, (err, res, body) => {
          if (err != undefined) {
            cb(err, null)
          } else {
            let json = null
            if (typeof body == `object`) {
              json = body
            } else {
              try {
                json = JSON.parse(body)
              } catch (err2) {
                err = err2
              }
            }
            if (res.statusCode != 200) {
              if (res.statusCode === 401 && conf.retry == undefined) {
                if (conf.refresh_token != undefined) {
                  Oauth2.refreshToken(conf, refresh_tokens => {
                    if (refresh_tokens != undefined) {
                      conf.retry = true
                      conf.access_token = refresh_tokens.access_token
                      conf.token_source = `oauth2_refresh`
                      Request.request(url, opts, conf, cb)
                    } else {
                      throw Error(`[OAuth2] refresh token may not be valid`)
                    }
                  })
                }
              } else {
                cb(json, null)
              }
            } else {
              if (isOauth){
                json[`updated_access_token`] = conf.access_token
              }
              cb(err, json)
            }
          }
        })
      })
    } else {
      this.auth(conf, headers => {
        if (conf.id_token != undefined) {
          headers[`Authorization`] = conf.id_token
        }
        Util.addHeaders(headers, opts, conf)
        let options = {
          url: url.toString(),
          headers: headers
        }
        Util.addBody(options, opts, conf)
        return request[method](options, (err, res, body) => {
          if (err != undefined) {
            cb(err, null)
          } else {
            let json = null
            if (typeof body == `object`) {
              json = body
            } else {
              try {
                json = JSON.parse(body)
              } catch (err2) {
                err = err2
              }
            }
            if (res.statusCode != 200) {
              if (res.statusCode === 401 && conf.retry == undefined) {
                if (
                  conf.refresh_token != undefined &&
                  conf.username != undefined
                ) {
                  Cognito.refreshToken(conf, refresh_tokens => {
                    if (refresh_tokens != undefined) {
                      conf.retry = true
                      conf.id_token = refresh_tokens.id_token
                      conf.refresh_token = refresh_tokens.refresh_token
                      conf.token_source = `cognito`
                      Request.request(url, opts, conf, cb)
                    } else {
                      delete conf.refresh_token
                      delete conf.id_token
                      if (conf.token_source == `cognito`) {
                        cb(json, null)
                      } else {
                        if (conf.token_source == `cache`) {
                          Cognito.rmCache()
                        }
                        Request.request(url, opts, conf, cb)
                      }
                    }
                  })
                } else {
                  delete conf.refresh_token
                  delete conf.id_token
                  conf.retry = true
                  Request.request(url, opts, conf, cb)
                }
              } else {
                cb(json, null)
              }
            } else {
              cb(err, json)
            }
          }
        })
      })
    }
  }

  static async requestP(url, opts = {}, conf = {}) {
    let method = conf.method || `get`
    const isOauth = conf.isOauth || false
    let headers = isOauth ? await this.oauthP(conf) : await this.authP(conf)
    Util.addHeaders(headers, opts, conf)
    let err, body
    let options = {
      url: url.toString(),
      headers: headers,
      transform: (body, res) => {
        if (typeof body === `object`) {
          return body
        } else {
          let json
          try {
            json = JSON.parse(body)
          } catch (err) {
            json = { statusCode: res.statusCode }
          }
          return json
        }
      }
    }
    Util.addBody(options, opts, conf)
    let res = await rp[method](options).catch(err2 => {
      err = err2
    })
    if (err != undefined) {
      if (err.statusCode === 401 && conf.retry == undefined) {
        if (isOauth && (conf.refresh_token != undefined)) {
          let refresh_tokens = await Oauth2.refreshTokenP(conf)
          if(refresh_tokens.access_token != undefined) {
            conf.refry = true
            conf.access_token = refresh_tokens.access_token
            conf.refresh_token = refresh_tokens.refresh_token
            conf.token_source = `oauth2_refresh`
            return await Request.requestP(url, opts, conf)
          } else {
            throw Error('[OAuth] refresh token may not be valid')
          }
        } else if (conf.refresh_token != undefined && conf.username != undefined) {
          let refresh_tokens = await Cognito.refreshTokenP(conf)
          if (refresh_tokens != undefined) {
            conf.retry = true
            conf.id_token = refresh_tokens.id_token
            conf.refresh_token = refresh_tokens.refresh_token
            conf.token_source = `cognito`
            return await Request.requestP(url, opts, conf)
          } else {
            delete conf.refresh_token
            delete conf.id_token
            if (conf.token_source == `cognito`) {
              throw err
            } else {
              if (conf.token_source == `cache`) {
                Cognito.rmCache()
              }
              return await Request.requestP(url, opts, conf)
            }
          }
        } else {
          delete conf.refresh_token
          delete conf.id_token
          conf.retry = true
          return await Request.requestP(url, opts, conf)
        }
      } else {
        throw err
      }
    }

    // return access_token for next OAuth call
    if (isOauth){
      res[`updated_access_token`] = conf.access_token
    }
    return res
  }
}

module.exports = Request
