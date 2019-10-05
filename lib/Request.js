const req = require(`request`)
const R = require(`./ramda`)
const apis = require(`./apis`)
const { addHeaders, addBody, getAPI } = require(`./Util`)
const Cognito = require(`./Cognito`)
const Oauth2 = require(`./Oauth2`)
const getIsOauth = R.propOr(false, `isOauth`)

const _makeBody = (url, opts, conf, headers) =>
  addBody(
    {
      url: url.toString(),
      headers: addHeaders(headers, opts, conf)
    },
    opts,
    conf
  )

const _parseJSON = R.unless(
  R.is(Object),
  R.tryCatch(
    R.compose(
      R.objOf(`json`),
      JSON.parse
    ),
    R.objOf(`err`)
  )
)

const getResJson = R.useWith(R.unapply(R.zipObj([`res`, `json`])), [
  R.identity,
  _parseJSON
])

const _successWithCb = (err, json, cb) => cb(err, json)

const _refreshCognito = R.curry((url, opts, json, cb, conf) =>
  Cognito.refreshToken(conf, refresh_tokens => {
    R.ifElse(
      R.isNotNil,
      () => {
        R.compose(
          R.curryN(4, request)(url, opts, R.__, cb),
          R.mutateValues(
            [`retry`, `id_token`, `refresh_token`, `token_source`],
            [
              true,
              refresh_tokens.id_token,
              refresh_tokens.refresh_token,
              `cognito`
            ]
          )
        )(conf)
      },
      () => {
        R.compose(
          R.ifElse(
            R.propEq(`token_source`, `cognito`),
            () => {
              cb(json, null)
            },
            R.compose(
              R.curryN(4, request)(url, opts, R.__, cb),
              R.when(R.propEq(`token_source`, `cache`), () => {
                Cognito.rmCache()
              })
            )
          )
        )(conf)
      }
    )(refresh_tokens)
  })
)

const _cbRetry = R.curry((url, opts, json, cb, conf) =>
  R.ifElse(
    R.both(
      R.propSatisfies(R.isNotNil, `username`),
      R.propSatisfies(R.isNotNil, `refresh_token`)
    ),
    _refreshCognito(url, opts, json, cb),
    _simpleRequest(url, opts, cb)
  )(conf)
)

const _oauthRetry = R.curry((url, opts, json, cb, conf) =>
  R.when(R.propSatisfies(R.isNotNil, `refresh_token`), () => {
    Oauth2.refreshToken(
      conf,
      R.ifElse(
        R.isNotNil,
        refresh_tokens => {
          R.mutateValues(
            [`retry`, `access_token`, `token_source`],
            [true, refresh_tokens.access_token, `oauth2_refresh`]
          )(conf)
          request(url, opts, conf, cb)
        },
        R.throw(`[OAuth2] refresh token may not be valid`)
      )
    )
  })(conf)
)

const _retryOr = R.curry((cb, json, retry, conf, res) =>
  R.ifElse(
    R.useWith(R.and, [
      R.propSatisfies(R.isNil, `retry`),
      R.propSatisfies(R.equals(401), `statusCode`)
    ]),
    retry(json, cb),
    () => {
      cb(json, null)
    }
  )(conf, res)
)

const _successWithOauth = R.curry((_err, json, cb, conf, res) => {
  R.when(
    getIsOauth,
    R.compose(
      R.mutateValue(`updated_access_token`, R.__, json),
      R.prop(`access_token`)
    )
  )(conf)
  cb(_err, json)
})

const _errCBOr = R.curry((cb, err, res, body) =>
  R.ifElse(
    R.isNotNil,
    () => {
      cb(err, null)
    },
    R.curryN(3, cb)(res, body)
  )(err)
)

const _res200Or = R.ifElse(R.propNotSatisfies(R.equals(200), `statusCode`))

const _getMethod = R.propOr(`get`, `method`)

const _simpleRequest = R.curry((url, opts, cb, conf) =>
  R.compose(
    R.curryN(4, request)(url, opts, R.__, cb),
    R.deleteValues([`refresh_token`, `id_token`]),
    R.mutateValue(`retry`, true)
  )(conf)
)

const _cbToken = R.curry((source, cb, conf, tokens, token_name) =>
  R.compose(
    cb,
    R.objOf(`Authorization`),
    R.prop(token_name),
    R.compose(
      R.mutateValues([token_name, `refresh_token`, `token_source`], R.__, conf),
      R.append(source),
      R.props([token_name, `refresh_token`])
    )
  )(tokens)
)

const _cbWithOauthToken = R.curry((source, cb, conf, tokens) =>
  _cbToken(source, cb, conf, tokens, `access_token`)
)

const _cbWithToken = R.curry((source, cb, conf, tokens) =>
  _cbToken(source, cb, conf, tokens, `id_token`)
)

const _authBase = (conf = {}, cb) =>
  R.cond([
    [R.isNotNil, _cbWithToken(`cache`, cb, conf)],
    [R.always(R.isNil(conf.password)), R.throw(`password is required`)],
    [
      R.T,
      () => {
        Cognito.getTokens(
          conf,
          R.ifElse(
            R.isNil,
            R.throw(`the wrong username or password`),
            _cbWithToken(`cognito`, cb, conf)
          )
        )
      }
    ]
  ])(Cognito.getCache(conf))

const _auth = (conf = {}, cb) =>
  R.cond([
    [
      R.compose(
        R.propNotSatisfies(R.isTrue, `auth`),
        getAPI
      ),
      () => {
        cb({})
      }
    ],
    [
      R.propSatisfies(R.isNotNil, `id_token`),
      R.compose(
        cb,
        R.objOf(`Authorization`),
        R.prop(`id_token`),
        R.mutateValue(`token_source`, `user`)
      )
    ],
    [
      R.T,
      R.ifElse(
        R.propSatisfies(R.isNil, `username`),
        R.throw(`username is required`),
        R.ifElse(
          R.propSatisfies(R.isNotNil, `refresh_token`),
          () => {
            Cognito.refreshToken(
              conf,
              R.ifElse(R.isNotNil, _cbWithToken(`cognito`, cb, conf), () => {
                _authBase(conf, cb)
              })
            )
          },
          R.curryN(2, _authBase)(R.__, cb)
        )
      )
    ]
  ])(conf)

const getReadWrite = R.compose(
  R.zipObj([`isRead`, `isWrite`]),
  R.juxt(R.ap([R.propOr(false)], [`read`, `write`])),
  getAPI
)

const _oauth = (conf = {}, cb) =>
  R.cond([
    [
      R.compose(
        R.not,
        R.apply(R.or),
        getReadWrite
      ),
      R.throw(`[OAuth] this end point is not allowed for oauth`)
    ],
    [
      R.both(
        R.compose(
          R.not,
          R.prop(`isRead`),
          getReadWrite
        ),
        R.compose(
          R.equals(`read`),
          R.propOr(`read`, `scope`)
        )
      ),
      R.throw(`[OAuth] this end point requires "write" scope`)
    ],
    [
      R.propSatisfies(R.isNotNil, `access_token`),
      R.compose(
        cb,
        R.objOf(`Authorization`),
        R.prop(`access_token`),
        R.mutateValue(`token_source`, `oauth2`)
      )
    ],
    [
      R.propSatisfies(R.isNotNil, `refresh_token`),
      () => {
        Oauth2.refreshToken(
          conf,
          R.ifElse(
            R.isNotNil,
            _cbWithOauthToken(`oauth2-refresh`, cb, conf),
            R.throw(`[OAuth] refresh_token may not be valid`)
          )
        )
      }
    ],
    [R.T, R.throw(`[Oauth] found neither access_token nor refresh_token`)]
  ])(conf)

const _makeRequestBase = (token_name, retry, success) => (
  url,
  opts,
  conf,
  cb
) => headers => {
  R.compose(
    R.apply(R.__, [
      _makeBody(url, opts, conf, headers),
      _errCBOr(
        R.compose(
          R.converge(R.call, [
            R.converge(R.call(_res200Or), [
              v => _retryOr(cb, v.json.json, retry(url, opts), conf),
              R.compose(v => () =>
                success(v.json.err, v.json.json, cb, conf, v.res)
              )
            ]),
            R.prop(`res`)
          ]),
          getResJson
        )
      )
    ]),
    R.prop(R.__, req),
    _getMethod,
    R.ifElse(
      R.propSatisfies(R.isNotNil, token_name),
      R.compose(
        R.mutateValue(`Authorization`, R.__, headers),
        R.prop(token_name)
      ),
      R.when(
        R.always(R.equals(`access_token`, token_name)),
        R.throw(`[OAuth] access_token is required`)
      )
    )
  )(conf)
}
const _makeRequest = _makeRequestBase(`id_token`, _cbRetry, _successWithCb)

const _makeOauthRequest = _makeRequestBase(
  `access_token`,
  _oauthRetry,
  _successWithOauth
)

const request = R.curry((url, opts = {}, conf = {}, cb) => {
  R.ifElse(
    getIsOauth,
    R.compose(
      R.applyTo(_makeOauthRequest(url, opts, conf, cb)),
      conf => R.curryN(2, _oauth)(conf)
    ),
    R.compose(
      R.applyTo(_makeRequest(url, opts, conf, cb)),
      conf => R.curryN(2, _auth)(conf)
    )
  )(conf)
})

const requestP = R.promisifyWithErr(request)

module.exports = { request, requestP }
