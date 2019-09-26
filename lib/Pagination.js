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

const _isByPage = R.pathSatisfies(R.isTrue, [`api`, `by_page`])

const _setStartEnd = obj => {
  R.ifElse(
    R.compose(
      R.equals(0),
      _getItemCount
    ),
    () => {
      obj.startNth = obj.endNth = 0
    },
    () => {
      obj.startNth = R.ifElse(
        R.pathSatisfies(R.isNil, [`conf`, `endNth`]),
        R.always(1),
        R.compose(
          R.inc,
          R.path([`conf`, `endNth`])
        )
      )(obj)
      obj.endNth = R.compose(
        R.dec,
        R.converge(R.add, [R.prop(`startNth`), _getItemCount])
      )(obj)
    }
  )(obj)
}

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

class Response {
  constructor(...args) {
    R.chain(
      R.mutateValues([`LEK`, `api`, `itemCount`, `isNext`]),
      R.compose(
        R.juxt([
          _getLEK,
          _propToGetAPI,
          _getItemCount,
          _getIsNext,
          _setStartEnd
        ]),
        R.setDefaultsTo([`opts`, `conf`], [{}, {}]),
        R.mutateValues([`opts`, `conf`, `json`, `url`, `cb`], args)
      )
    )(this)
  }
  cpParams(opts = {}, opts2 = {}) {
    R.forEachObjIndexed((v, k) => {
      opts[k] = v
    })(opts2)
    R.ifElse(
      _isByPage,
      () => {
        opts.page = R.compose(
          R.inc,
          R.pathOr(1, [`opts`, `page`])
        )(this)
      },
      () => {
        R.forEach(k => {
          opts[k] = R.propOr(null, k)(this.LEK)
        })(COPY_FIELDS)
      }
    )(this)
    this.conf.endNth = this.endNth
  }
}

class _Pagination extends Response {
  constructor(opts = {}, conf = {}, json, url, cb) {
    super(opts, conf, json, url, cb)
  }
  stop() {
    this.cb(null, this)
  }
  next(opts = {}) {
    R.ifElse(
      R.propSatisfies(R.isTrue, `isNext`),
      () => {
        this.cpParams(this.opts, opts)
        pagination(this.opts, this.conf, this.cb)
      },
      () => {
        this.cb(null, this)
      }
    )(this)
  }
}

class _PaginationP extends Response {
  constructor(opts = {}, conf = {}, json, url) {
    super(opts, conf, json, url)
  }
  async next(opts = {}) {
    return R.ifElse(
      R.propSatisfies(R.isTrue, `isNext`),
      async () => {
        this.cpParams(this.opts, opts)
        return await paginationP(this.opts, this.conf)
      },
      R.alwaysNull
    )(this)
  }
}
const _getUrlInstance = (opts, conf, cb) =>
  R.tryCatch(makeUrl, _cbIfErr(cb))(opts, conf)

const pagination = (opts = {}, conf = {}, cb) => {
  R.compose(
    url =>
      R.compose(
        R.applyTo((err, json) => {
          R.ifElse(R.always(_isPagination(conf)), cb, () => {
            const pagination = new _Pagination(opts, conf, json, url, cb)
            R.ifElse(
              R.propIs(Function, `getAll`),
              () => {
                conf.getAll(
                  R.propOr(null, `json`)(pagination),
                  R.bind(pagination.next, pagination),
                  R.bind(pagination.stop, pagination),
                  pagination
                )
              },
              () => {
                cb(null, R.propOr(null, `json`)(pagination), pagination)
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
  return R.ifElse(R.always(_isPagination(conf)), R.identity, async json => {
    const pagination = new _PaginationP(opts, conf, json, url)
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
          return conf.getAllSync(pagination.json, pagination)
        }
      ],
      [R.T, R.T]
    ])(conf)
    return R.ifElse(
      R.compose(
        R.or(isStop),
        R.propNotSatisfies(R.isTrue, `isNext`)
      ),
      R.always(json),
      async () => {
        return await pagination.next(nopts)
      }
    )(pagination)
  })(await requestP(url, opts, conf))
}

module.exports = { pagination, paginationP }
