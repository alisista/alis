const R = require(`./ramda`)
const apis = require(`./apis`)
const { makeUrl, getAPI } = require(`./Util`)
const { request, requestP } = require(`./Request`)

const { COPY_FIELDS } = require(`./consts`)

const _getLEK = R.path([`json`, `LastEvaluatedKey`])

const _propToGetAPI = R.compose(
  getAPI,
  R.prop(`conf`)
)

const _getItemCount = R.ifElse(
  R.propIs(Array, `json`),
  R.compose(
    R.length,
    R.propOr([], `json`)
  ),
  R.compose(
    R.length,
    R.pathOr([], [`json`, `Items`])
  )
)

const _getIsNext = R.ifElse(
  R.pathSatisfies(R.isTrue, [`api`, `by_page`]),
  R.compose(
    R.converge(R.gte, [_getItemCount, R.pathOr(20, [`opts`, `limit`])])
  ),
  R.ifElse(
    R.compose(
      R.isNil,
      _getLEK
    ),
    R.F,
    R.T
  )
)

const _getOnlyIsNext = R.curry((conf, json, opts) =>
  R.compose(
    _getIsNext,
    R.unapply(R.zipObj([`conf`, `json`, `opts`]))
  )(conf, json, opts)
)

const _isByPage = R.pathSatisfies(R.isTrue, [`api`, `by_page`])

const _setStartEnd = obj =>
  R.ifElse(
    R.compose(
      R.equals(0),
      _getItemCount
    ),
    R.compose(
      R.assoc(`startNth`, 0),
      R.assoc(`endtNth`, 0)
    ),
    obj => {
      return R.compose(
        R.chain(
          R.assoc(`endNth`),
          R.compose(
            R.dec,
            R.converge(R.add, [R.prop(`startNth`), _getItemCount])
          )
        ),
        R.chain(
          R.assoc(`startNth`),
          R.ifElse(
            R.pathSatisfies(R.isNil, [`conf`, `endNth`]),
            R.always(1),
            R.compose(
              R.inc,
              R.path([`conf`, `endNth`])
            )
          )
        )
      )(obj)
    }
  )(obj)

const _cbIfErr = cb =>
  R.compose(
    R.always(null),
    err => {
      cb(err)
    },
    R.identity
  )

const _isPagination = R.compose(
  R.propNotSatisfies(R.isTrue, `pagination`),
  R.converge(R.path, [
    R.juxt([R.prop(`path_name`), R.propOr(`get`, `method`)]),
    R.always(apis)
  ])
)

const _getIsStop = conf => {
  return new Promise((res, rej) => {
    conf.getAll(
      pagination.json,
      () => {
        res(false)
      },
      () => {
        res(true)
      },
      pagination
    )
  })
}

const _makePagination = (...args) =>
  R.compose(
    R.ap(
      R.mergeLeft,
      R.compose(
        R.zipObj([`LEK`, `api`, `itemCount`, `isNext`]),
        R.juxt([_getLEK, _propToGetAPI, _getItemCount, _getIsNext])
      )
    ),
    _setStartEnd,
    R.zipObj([`conf`, `json`, `cb`, `opts`])
  )(args)

const _cpParams = R.curryN(2, (opts2 = {}, obj) =>
  R.compose(
    R.ifElse(
      _isByPage,
      R.chain(
        R.assoc(`page`),
        R.compose(
          R.inc,
          R.pathOr(1, [`opts`, `page`])
        )
      ),
      obj => {
        R.forEach(k => {
          obj.opts[k] = R.propOr(null, k)(obj.LEK)
        })(COPY_FIELDS)
        return obj
      }
    ),
    R.chain(R.assocPath([`conf`, `endNth`]), R.prop(`endNth`)),
    R.evolve({ opts: R.mergeRight(opts2) })
  )(obj)
)

const _stop = (json, cb) => () => cb(null, json)

const _nextBase = pagination_func => (opts, conf, json, cb) => (opts2 = {}) =>
  R.compose(
    R.apply(pagination_func),
    R.props(["opts", "conf", "cb"]),
    _cpParams(opts2),
    R.curryN(4, _makePagination)(conf, json, cb)
  )(opts)

const _getUrlInstance = (opts, conf, cb) =>
  R.tryCatch(makeUrl, _cbIfErr(cb))(opts, conf)

const pagination = (opts = {}, conf = {}, cb) => {
  R.compose(
    url =>
      R.compose(
        R.applyTo((err, json) => {
          R.ifElse(R.always(_isPagination(conf)), cb, () => {
            R.ifElse(
              R.propIs(Function, `getAll`),
              () => {
                conf.getAll(json, _next(opts, conf, json, cb), _stop(json, cb))
              },
              () => {
                cb(null, json)
              }
            )(conf)
          })(err, json)
        }),
        R.curryN(4, request)(R.__, opts, conf)
      )(url),
    _getUrlInstance
  )(opts, conf, cb)
}

const paginationP = async (opts = {}, conf = {}) => {
  const url = makeUrl(opts, conf)
  const res = await R.ifElse(
    R.always(_isPagination(conf)),
    R.identity,
    async json => {
      let nopts
      const isStop = await R.cond([
        [
          R.propIs(Function, `getAll`),
          async () => {
            const _isStop = await _getIsStop(conf)
            return R.when(R.isTrue, v => {
              nopts = v
              return false
            })(_isStop)
          }
        ],
        [
          R.propIs(Function, `getAllSync`),
          () => {
            return conf.getAllSync(json)
          }
        ],
        [R.T, R.T]
      ])(conf)
      return await R.ifElse(
        R.compose(
          R.or(isStop),
          R.complement(_getOnlyIsNext)(conf, json)
        ),
        R.always(json),
        _nextP(nopts, conf, json, null)
      )(opts)
    }
  )(await requestP(url, opts, conf))
  return res
}

const _next = _nextBase(pagination)

const _nextP = _nextBase(paginationP)

module.exports = { pagination, paginationP }
