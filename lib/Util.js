const URL = require(`url`).URL

const R = require(`./ramda`)
const apis = require(`./apis`)
const {
  API_ENDPOINT,
  OAUTH_API_ENDPOINT,
  ALLOWED_PARAM_NAMES
} = require(`./consts`)

const getAssocs = (opts, tar) =>
  R.map(k => {
    return R.assoc(tar || k, opts[k])
  })

const getXKeys = (x, conf) => {
  const api = apis[conf.path_name][conf.method || `get`]
  return R.compose(
    R.filter(R.propEq(R.__, x, api)),
    R.keys
  )
}

const addX = (options, opts, conf, key, tar) =>
  R.compose(
    R.flipCompose(options),
    getAssocs(opts, tar),
    getXKeys(key, conf)
  )(opts)

const getAPIMethod = R.propOr(`get`, `method`)

const getAPICall = R.compose(
  R.when(R.isNil, R.throw(`api call doesn't exist`)),
  R.prop(R.__, apis),
  R.prop(`path_name`)
)
const getAPI = R.converge(R.prop, [getAPIMethod, getAPICall])

const throwIfAPIMethodUndefined = R.compose(
  R.when(R.isNil, R.throw(`the wrong method`)),
  getAPI
)
const isOauth = R.propOr(false, `isOauth`)

const getEndPoint = R.ifElse(
  isOauth,
  R.always(OAUTH_API_ENDPOINT),
  R.always(API_ENDPOINT)
)

const getPathName = (opts, conf, api) =>
  R.compose(
    R.join(`/`),
    R.map(v =>
      R.when(R.propEq(R.__, `path`, api), () =>
        R.ifElse(
          R.propSatisfies(R.isNil, v),
          R.throw(`${v} is required`),
          R.prop(v)
        )(opts)
      )(v)
    ),
    R.split(`/`),
    R.prop(`path_name`)
  )(conf)

const isPromise = R.propSatisfies(R.isTrue, `ispromise`)

const getCallConf = R.last

const getCB = R.lastN(2)

const getMinArgs = R.compose(
  R.ifElse(isPromise, R.always(3), R.always(4)),
  getCallConf
)

const isTooManyArgs = R.converge(R.gt, [R.length, getMinArgs])

const throwIfTooManyArgs = R.when(isTooManyArgs, R.throw(`too many arguments`))

const isCB = R.compose(
  R.complement(isPromise),
  getCallConf
)

const throwIfCBNotFunction = R.when(
  isCB,
  R.compose(
    R.unless(R.is(Function), R.throw(`callback must be a function`)),
    getCB
  )
)

const tailLength = R.compose(
  R.length,
  R.filter(R.isTrue),
  R.juxt([R.T, isCB])
)

const isOpts = R.both(
  R.converge(R.gt, [R.length, tailLength]),
  R.isNonEmptyArray
)

const isConf = R.both(
  R.converge(R.gt, [
    R.length,
    R.compose(
      R.inc,
      tailLength
    )
  ]),
  isOpts
)

const getOpts = R.compose(
  R.defaultTo({}),
  R.ifElse(isOpts, R.head, R.always({}))
)

const getConf = R.compose(
  R.defaultTo({}),
  R.ifElse(isConf, R.prop(1), R.always({}))
)

const throwIfOptsNotObject = R.compose(
  R.unless(
    R.is(Object),
    R.throwType(TypeError, `first argument must be an object`)
  ),
  getOpts
)

const throwIfConfNotObject = R.compose(
  R.unless(
    R.is(Object),
    R.throw(TypeError, `second argument must be an object`)
  ),
  getConf
)

const modMethod = R.compose(
  R.toLower,
  R.defaultTo(`get`)
)
const modConfMethod = R.forceEvolve({ method: modMethod })

const getUnknownParams = R.compose(
  R.difference(R.__, ALLOWED_PARAM_NAMES),
  R.keys
)

const throwIfConfIncludesUnknowParams = R.compose(
  R.when(
    R.isNonEmptyArray,
    R.compose(
      R.throw,
      v => `unknown parameter ${v}`,
      R.join(`, `)
    )
  ),
  getUnknownParams,
  getConf
)

const makeConf = R.compose(
  modConfMethod,
  R.converge(R.mergeLeft, [getCallConf, getConf])
)

const getUrlInstance = (opts, conf, api) => {
  const url = new URL(getEndPoint(conf))
  url.pathname = R.concat(url.pathname)(getPathName(opts, conf, api))
  R.mapObjIndexed((v, k) => {
    R.when(
      R.both(
        R.propSatisfies(R.isNotNil, R.__, opts),
        R.propSatisfies(R.isNil, R.__, api)
      ),
      () => {
        url.searchParams.set(k, v)
      }
    )(k)
  })(opts)
  return url
}

module.exports = {
  makeUrl: (opts, conf) => {
    const api = throwIfAPIMethodUndefined(conf)
    return getUrlInstance(opts, conf, api)
  },
  validate: (...args) =>
    R.when(
      R.allPass([
        throwIfTooManyArgs,
        throwIfCBNotFunction,
        throwIfOptsNotObject,
        throwIfConfNotObject,
        throwIfConfIncludesUnknowParams
      ]),
      R.juxt([getOpts, makeConf, getCB])
    )(args),
  addBody: R.curry((options, opts, conf) => {
    return addX(options, opts, conf, `body`, `json`)
  }),
  addHeaders: R.curry((headers, opts, conf) => {
    return addX(headers, opts, conf, `header `)
  }),
  getAPI: getAPI
}
