const fs = require(`fs`)
const path = require(`path`)
const AmazonCognitoIdentity = require(`amazon-cognito-identity-js`)
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool
global.fetch = require(`node-fetch`)

const R = require(`./ramda`)
const { POOL_DATA } = require(`./consts`)

const _ifFileExists = fn =>
  R.compose(
    R.ifElse(fs.existsSync, R.tryCatch(fn, R.alwaysNull), R.alwaysNull),
    path.resolve,
    R.propFn(x => `${__dirname}/../.alis/${x}.json`, `username`)
  )

const getCache = _ifFileExists(
  R.compose(
    R.when(R.propSatisfies(R.isNil, `id_token`), R.alwaysNull),
    JSON.parse,
    R.curryN(2, fs.readFileSync)(R.__, `utf8`)
  )
)

const rmCache = _ifFileExists(fs.unlinkSync)

const getCognitoUser = conf =>
  new AmazonCognitoIdentity.CognitoUser({
    Username: conf.username,
    Pool: new AmazonCognitoIdentity.CognitoUserPool(POOL_DATA)
  })

const regTokens = (session, conf, cb) =>
  R.compose(
    cb,
    R.tryCatch(tokens => {
      return R.compose(
        R.always(tokens),
        R.curryN(2, fs.writeFileSync)(R.__, JSON.stringify(tokens)),
        path.resolve,
        dir_path => `${dir_path}/${conf.username}.json`,
        R.when(R.complement(fs.existsSync), R.tap(fs.mkdirSync)),
        path.resolve
      )(`${__dirname}/../.alis`)
    }, R.identity)
  )({
    username: conf.username,
    access_token: session.accessToken.jwtToken,
    id_token: session.idToken.jwtToken,
    refresh_token: session.refreshToken.token
  })

const refreshToken = (conf = {}, cb) =>
  getCognitoUser(conf).refreshSession(
    new AmazonCognitoIdentity.CognitoRefreshToken({
      RefreshToken: conf.refresh_token
    }),
    (err, session) =>
      R.ifElse(
        R.isNotNil,
        () => {
          cb(null)
        },
        () => {
          regTokens(session, conf, cb)
        }
      )(err)
  )

const getTokens = (conf, cb) =>
  getCognitoUser(conf).authenticateUser(
    new AmazonCognitoIdentity.AuthenticationDetails({
      Username: conf.username,
      Password: conf.password
    }),
    {
      onSuccess: result => regTokens(result, conf, cb),
      onFailure: err => cb(null)
    }
  )

module.exports = {
  getCache,
  rmCache,
  getCognitoUser,
  regTokens,
  refreshToken,
  getTokens
}
