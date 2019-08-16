const URL = require(`url`).URL

const apis = require(`./apis`)

const ep = `https://alis.to/api`

class Util {
  static makeUrl(opts, conf) {
    const method = conf.method || `get`
    let api = apis[conf.path_name]
    if (api == undefined) {
      throw Error(`api call doesn't exist`)
    }
    api = api[method]
    if (api == undefined) {
      throw Error(`the wrong method`)
    }
    let path_name = []
    for (let v of conf.path_name.split(`/`)) {
      if (api[v] === `path`) {
        if (opts[v] == undefined) {
          throw Error(`${v} is required`)
        } else {
          path_name.push(opts[v])
        }
      } else {
        path_name.push(v)
      }
    }
    let url = new URL(ep)
    url.pathname += path_name.join(`/`)
    for (let k in opts) {
      if (opts[k] != undefined && api[k] == undefined) {
        url.searchParams.set(k, opts[k])
      }
    }
    return url
  }

  static validate(...args) {
    let opts, conf, cb
    let call_conf = args.pop()
    let min_args = 3
    if (call_conf.ispromise === true) {
      min_args -= 1
    }
    if (args.length > min_args) {
      throw Error(`too many arguments`)
    } else {
      if (call_conf.ispromise !== true) {
        cb = args.pop()
        if (typeof cb !== `function`) {
          throw TypeError(`callback must be a function`)
        }
      }
      if (args.length != 0) {
        opts = args.shift() || {}
      }
      if (args.length != 0) {
        conf = args.shift() || {}
      }
      opts = opts || {}
      if (typeof opts !== `object`) {
        throw TypeError(`first argument must be an object`)
      }
      conf = conf || {}
      if (typeof conf !== `object`) {
        throw TypeError(`second argument must be an object`)
      }
      for (let k in conf) {
        if (
          [
            `method`,
            `id_token`,
            `getAll`,
            `getAllSync`,
            `username`,
            `password`,
            `refresh_token`
          ].includes(k) === false
        ) {
          throw Error(`unknown parameter ${k}`)
        }
      }
      for (let k in call_conf) {
        conf[k] = call_conf[k]
      }
    }
    conf.method = (conf.method || `get`).toLowerCase()
    return [opts, conf, cb]
  }

  static addBody(options, opts, conf) {
    let api = apis[conf.path_name][conf.method || `get`]
    for (let k in opts) {
      if (api[k] == `body`) {
        options.json = opts[k]
        break
      }
    }
  }

  static addHeaders(headers, opts, conf) {
    let api = apis[conf.path_name][conf.method || `get`]
    for (let k in opts) {
      if (api[k] == `header`) {
        headers[k] = opts[k]
      }
    }
  }

  static addParams(url, fields, values) {
    for (let v of fields) {
      if (values[v] != undefined) {
        url.searchParams.set(v, values[v])
      }
    }
  }
}

module.exports = Util
