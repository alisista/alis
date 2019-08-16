const apis = require(`./lib/apis`)
let Call = require(`./lib/Call`)

let AlisP = {}
let AlisOauthP = {}
let AlisOauth = {
  p: AlisOauthP
}
let Alis = {
  p: AlisP,
  oauth: AlisOauth
}

for(let k in apis){
  let paths = k.split(`/`)
  paths.shift()

  let cur = Alis
  let curP = AlisP
  let curOauth = AlisOauth
  let curOauthP = AlisOauthP

  while(paths.length > 0){
    let next_path = paths.shift()
    if(cur[next_path] == undefined){
      cur[next_path] = {}
      curP[next_path] = {}
      curOauth[next_path] = {}
      curOauthP[next_path] = {}
    }
    cur = cur[next_path]
    curP = curP[next_path]
    curOauth = curOauth[next_path]
    curOauthP = curOauthP[next_path] 
  }
  let func = (...args) => {
    args.push({path_name:k})
    Call.call.apply(null, args)
  }
  let funcP = async (...args) => {
    args.push({path_name: k, ispromise: true})
    return await Call.callP.apply(null, args)
  }
  let funcOauth = (...args) => {
    args.push({path_name: k, isOauth: true})
    Call.call.apply(null, args)
  }
  let funcOauthP = async (...args) => {
    args.push({path_name: k, ispromise: true, isOauth: true})
    return await Call.callP.apply(null, args)
  }
  eval(`Alis.${k.split(`/`).slice(1).join(`.`)} = ` + func)
  eval(`AlisP.${k.split(`/`).slice(1).join(`.`)} = ` + funcP)
  eval(`AlisOauth.${k.split(`/`).slice(1).join(`.`)} = ` + funcOauth)
  eval(`AlisOauthP.${k.split(`/`).slice(1).join(`.`)} = ` + funcOauthP)
}

module.exports = Alis
