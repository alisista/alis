const Util = require(`./Util`)

const apis = require(`./apis`)
const Pagination = require(`./Pagination`)

class Call {
  static async callP(...args) {
    let [opts, conf] = Util.validate.apply(null, args)
    return await Pagination.paginationP(opts, conf)
  }

  static call(...args) {
    let [opts, conf, cb] = Util.validate.apply(null, args)
    Pagination.pagination(opts, conf, cb)
  }
}

module.exports = Call
