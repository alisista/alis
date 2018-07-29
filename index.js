const apis = require(`./lib/apis`)
let Call = require(`./lib/Call`)

let AlisP = {}

let Alis = {
  p: AlisP
}

for(let k in apis){
  let paths = k.split(`/`)
  paths.shift()
  let cur = Alis
  let curP = AlisP
  while(paths.length > 0){
    let next_path = paths.shift()
    if(cur[next_path] == undefined){
      cur[next_path] = {}
      curP[next_path] = {}
    }
    cur = cur[next_path]
    curP = curP[next_path]    
  }
  let func = (...args)=>{
    args.push({path_name:k})
    Call.call.apply(null,args)
  }
  let funcP = async (...args)=>{
    args.push({path_name:k, ispromise:true})
    return await Call.callP.apply(null,args)
  }
  eval(`Alis.${k.split(`/`).slice(1).join(`.`)} = ` + func)
  eval(`AlisP.${k.split(`/`).slice(1).join(`.`)} = ` + funcP)
}

module.exports = Alis
