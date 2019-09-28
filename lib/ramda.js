const ramda = require("ramda")

const R = ramda.mergeAll([
  require("ramda-extension"),
  require("ramda-adjunct"),
  ramda
])
R.log = R.tap(console.log)
R.throwType = R.curry((error_type = Error) => text => () => {
  throw error_type(text)
})

R.throw = R.throwType(Error)

R.propFn = (fn, prop) =>
  R.compose(
    fn,
    R.prop(prop)
  )
R.promisifyWithErr = fn => {
  return (...args) =>
    new Promise((ret, rej) => {
      args.push((err, res) => {
        R.ifElse(
          R.isNil,
          () => {
            ret(res)
          },
          rej
        )(err)
      })
      R.apply(fn, args)
    })
}

R.promisify = fn => {
  return (...args) => {
    return new Promise(ret => {
      args.push(ret)
      R.apply(fn, args)
    })
  }
}

R.lastN = n =>
  R.compose(
    R.head,
    R.takeLast(n)
  )

R.argsToObj = R.curry((arr, fn) => {
  return R.curryN(R.length(arr), (...args) => fn(R.zipObj(arr, args)))
})

R.mapObjAccum = R.curry((fn, init, obj) => {
  let _init = R.clone(init)
  let aobj = {}
  let arr = []
  R.mapObjIndexed((v, k) => {
    const res = fn(_init, v, k)
    aobj[k] = res[1]
    arr.push(res[1])
    _init = res[0]
  })(obj)
  return [_init, aobj, arr, obj]
})

R.mutateValue = R.curry((key, val, obj) => {
  obj[key] = val
  return obj
})

R.deleteValue = R.curry((key, obj) => {
  delete obj[key]
  return obj
})

R.deleteValues = R.curry((keys, obj) => {
  R.forEach(k => {
    R.deleteValue(k)(obj)
  })(keys)
  return obj
})

R.mutateValues = R.curry((keys, vals, obj) => {
  R.compose(
    R.forEachObjIndexed((v, k) => {
      R.mutateValue(k, v)(obj)
    }),
    R.zipObj(keys)
  )(vals)
  return obj
})

R.setDefaultsTo = R.curry((paths, defs, obj) => {
  R.compose(
    R.forEachObjIndexed((v, k) => {
      obj[k] = R.when(R.isNil, R.always(v))(obj[k])
    }),
    R.zipObj(paths)
  )(defs)
  return obj
})

R.forceEvolve = R.argsToObj(["ev", "obj"], obj =>
  R.compose(
    R.converge(R.evolve, [R.prop("ev"), R.prop("obj")]),
    R.applySpec({ ev: R.prop(3), obj: R.prop(0) }),
    R.converge(R.mapObjAccum, [
      R.always((acc, v, k) => [
        R.when(R.propSatisfies(R.isNil, k), R.assoc(k, null))(acc),
        v
      ]),
      R.prop("obj"),
      R.prop("ev")
    ])
  )(obj)
)

R.propMap = R.curry((prop, fn, obj) =>
  R.compose(
    R.assoc(prop, R.__, obj),
    R.map((...args) =>
      R.compose(
        R.apply(fn),
        R.append(obj)
      )(args)
    ),
    R.prop(prop)
  )(obj)
)

R.flipCompose = R.curry((obj, funcs) => {
  return R.ifElse(
    R.compose(
      R.equals(0),
      R.length
    ),
    R.always(obj),
    R.compose(
      R.applyTo(obj),
      R.apply(R.compose)
    )
  )(funcs)
})

module.exports = R
