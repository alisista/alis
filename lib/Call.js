const R = require(`./ramda`)
const { validate } = require(`./Util`)
const apis = require(`./apis`)
const Pagination = require(`./Pagination`)

const _call = func_name =>
  R.compose(
    R.apply(Pagination[func_name]),
    validate
  )

module.exports = {
  callP: _call(`paginationP`),
  call: _call(`pagination`)
}
