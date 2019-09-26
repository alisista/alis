const fetch = require(`node-fetch`)

const R = require(`./ramda`)

const { REFRESH_TOKEN_URL } = require(`./consts`)

const _throw_if_id_or_secret_missing = R.when(
  R.any(R.isNil),
  R.throw(
    `[OAuth] cliend_id and client_secret are required in the second argument of call`
  )
)

const _get_id_and_client = R.props(["client_id", "client_secret"])

const _get_base64_token = arr =>
  Buffer.from(`${arr[0]}:${arr[1]}`).toString(`base64`)

const _fetch_refresh_token = conf => token =>
  fetch(REFRESH_TOKEN_URL, {
    body: `grant_type=refresh_token&refresh_token=${conf.refresh_token}`,
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": `application/x-www-form-urlencoded`,
      charset: "utf-8"
    }
  }).then(response => response.json())

const refreshToken = (conf = {}, cb) =>
  R.compose(
    R.then(cb),
    _fetch_refresh_token(conf),
    _get_base64_token,
    _throw_if_id_or_secret_missing,
    _get_id_and_client
  )(conf)

module.exports = { refreshToken }
