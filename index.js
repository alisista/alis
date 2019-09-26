const R = require(`./lib/ramda`)
const apis = require(`./lib/apis`)
const Call = require(`./lib/Call`)

const getFunc = R.ifElse(
  R.propSatisfies(R.isTrue, `ispromise`),
  R.always(Call.callP),
  R.always(Call.call)
)

const applyArgs = v2 =>
  R.compose(
    R.apply(getFunc(v2)),
    R.append(v2)
  )

const makeFunc = path_name =>
  R.compose(
    v2 => R.unapply(applyArgs(v2)),
    R.assoc(`path_name`, path_name)
  )

const getFuncModels = path_name =>
  R.map(makeFunc(path_name))({
    alis: {},
    "alis.p": { ispromise: true },
    "alis.oauth": { isOauth: true },
    "alis.oauth.p": { ispromise: true, isOauth: true }
  })

const rmAlis = R.compose(
  R.sliceFrom(1),
  R.split(`.`)
)

const getMethodPath = key =>
  R.compose(
    R.insertAll(0, rmAlis(key)),
    R.sliceFrom(1),
    R.split(`/`)
  )

const makeMethod = R.curry((path_name, obj) =>
  R.compose(
    R.values,
    R.mapObjIndexed((func, key) =>
      R.compose(
        R.pair(R.__, func),
        getMethodPath(key)
      )(path_name)
    )
  )(obj)
)

const getMethodAssocComposition = R.chain(R.ap(makeMethod, getFuncModels))

let alis = { p: {}, oauth: { p: {} } }

const isLastElem = index =>
  R.compose(
    R.equals(index),
    R.dec,
    R.length,
    R.prop(0)
  )

const assocMethods = R.forEach(path_func =>
  R.addIndex(R.reduce)(
    (obj, key, index) =>
      R.when(
        R.isNil,
        () =>
          (obj[key] = R.ifElse(isLastElem(index), R.prop(1), R.always({}))(
            path_func
          ))
      )(obj[key]),
    alis
  )(path_func[0])
)

R.compose(
  assocMethods,
  getMethodAssocComposition,
  R.sortBy(R.length),
  R.keys
)(apis)

module.exports = alis
