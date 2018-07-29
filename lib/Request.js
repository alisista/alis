const request = require(`request`)
const rp = require(`request-promise`)

const apis = require(`./apis`)
const Util = require(`./Util`)
const Cognito = require(`./Cognito`)

class Request{
  
  static _auth(conf = {}, cb){
    let tokens = Cognito.getCache(conf)
    let headers = {}
    if(tokens != null){
      headers[`Authorization`] = tokens.id_token
      conf.id_token = tokens.id_token
      conf.refresh_token = tokens.refresh_token
      conf.token_source = `cache`
      cb(headers)
    }else if(tokens == null && conf.password == undefined){
      throw Error(`password is required`)
    }else{
      Cognito.getTokens(conf, (tokens)=>{
	if(tokens == null){
	  throw Error(`the wrong username or password`)	      
	}else{
	  headers[`Authorization`] = tokens.id_token
	  conf.id_token = tokens.id_token
	  conf.refresh_token = tokens.refresh_token
	  conf.token_source = `cognito`
	  cb(headers)
	}
      })
    }    
  }
  
  static auth(conf = {}, cb){
    let headers = {}
    if(apis[conf.path_name][conf.method || `get`].auth !== true){
      cb(headers)
    }else if(conf.id_token != undefined){
      headers[`Authorization`] = conf.id_token
      conf.token_source = `user`
      cb(headers)
    }else{
      if(conf.username == undefined){
	throw Error(`username is required`)
      }else{
	if(conf.refresh_token != undefined){
	  Cognito.refreshToken(conf, (tokens)=>{
	    if(tokens != null){
	      headers[`Authorization`] = tokens.id_token
	      conf.id_token = tokens.id_token
	      conf.refresh_token = tokens.refresh_token
	      conf.token_source = `cognito`
	      cb(headers)
	    }else{
	      Request._auth(conf, cb)
	    }
	  })
	}else{
	  Request._auth(conf, cb)
	}

      }
    }
  }
  
  static async authP(conf = {}){
    let headers = {}
    if(apis[conf.path_name][conf.method || `get`].auth === true){
      if(conf.id_token != undefined){
	headers[`Authorization`] = conf.id_token
	conf.token_source = `user`
      }else{
	if(conf.username == undefined){
	  throw Error(`username is required`)
	}else{
	  let tokens, token_source
	  if(conf.refresh_token != undefined){
	    tokens = await Cognito.refreshTokenP(conf)
	    token_source = `cognito`	    
	  }
	  tokens = tokens || Cognito.getCache(conf)
	  if(tokens != null){
	    headers[`Authorization`] = tokens.id_token
	    conf.id_token = tokens.id_token
	    conf.refresh_token = tokens.refresh_token
	    conf.token_source = token_source || `cache`
	  }else if(tokens == null && conf.password == undefined){
	    throw Error(`password is required`)
	  }else{
	    let tokens = await Cognito.getTokensP(conf)
	    if(tokens == null){
	      throw Error(`the wrong username or password`)	      
	    }else{
	      headers[`Authorization`] = tokens.id_token
	      conf.id_token = tokens.id_token
	      conf.refresh_token = tokens.refresh_token
	      conf.token_source = `cognito`
	    }
	  }
	}
      }
    }
    return headers
  }
  
  static request(url, opts = {}, conf = {}, cb){
    let method = conf.method || `get`
    this.auth(conf,(headers)=>{
      if(conf.id_token != undefined){
	headers[`Authorization`] = conf.id_token
      }
      Util.addHeaders(headers, opts, conf)            
      let options = {
	url:url.toString(),
	headers:headers
      }
      Util.addBody(options, opts, conf)      
      return request[method](
	options,
	(err,res,body)=>{
	  if(err != undefined){
	    cb(err, null)
	  }else{
	    let json = null
	    if(typeof(body) == `object`){
	      json = body
	    }else{
	    try{
	      json = JSON.parse(body)
	    }catch(err2){
	      err = err2
	    }
	    }
	    if(res.statusCode != 200){
	      if(res.statusCode === 401 && conf.retry == undefined){
		if(conf.refresh_token != undefined && conf.username != undefined){
		  Cognito.refreshToken(conf,(refresh_tokens)=>{
		    if(refresh_tokens != undefined){
		      conf.retry = true
		      conf.id_token = refresh_tokens.id_token
		      conf.refresh_token = refresh_tokens.refresh_token
		      conf.token_source = `cognito`
		      Request.request(url, opts, conf, cb)		    		      
		    }else{
		      delete conf.refresh_token
		      delete conf.id_token
		      if(conf.token_source == `cognito`){
			cb(json, null)
		      }else{
			if(conf.token_source == `cache`){
			  Cognito.rmCache()
			}
			Request.request(url, opts, conf, cb)		    
		      }
		    }
		  })
		}else{
		  delete conf.refresh_token
		  delete conf.id_token
		  conf.retry = true
		  Request.request(url, opts, conf, cb)
		}
	      }else{
		cb(json, null)	      
	      }
	    }else{
	      cb(err, json)
	    }
	  }
	}
      )
    })
  }
  
  static async requestP(url, opts = {}, conf = {}){
    let method = conf.method || `get`    
    let headers = await this.authP(conf)
    Util.addHeaders(headers, opts, conf)
    let err, body
    let options = {
      url:url.toString(),
      headers:headers,
      transform:(body, res)=>{
	if(typeof(body) === `object`){
	  return body
	}else{
	  let json
	  try{
	    json = JSON.parse(body)
	  }catch(err){
	    json = {statusCode: res.statusCode}
	  }
	  return json	  
	}

      }
    }
    Util.addBody(options, opts, conf)
    let res = await rp[method](options)
	.catch((err2)=>{err = err2})
    if(err != undefined){
      if(err.statusCode === 401 && conf.retry == undefined){
	if(conf.refresh_token != undefined && conf.username != undefined){
	  let refresh_tokens = await Cognito.refreshTokenP(conf)
	  if(refresh_tokens != undefined){
	    conf.retry = true
	    conf.id_token = refresh_tokens.id_token
	    conf.refresh_token = refresh_tokens.refresh_token
	    conf.token_source = `cognito`
	    return await Request.requestP(url, opts, conf)	  
	  }else{
	    delete conf.refresh_token
	    delete conf.id_token
	    if(conf.token_source == `cognito`){
	      throw err
	    }else{
	      if(conf.token_source == `cache`){
		Cognito.rmCache()
	      }
	      return await Request.requestP(url, opts, conf)	    
	    }
	  }
	}else{
	  delete conf.refresh_token
	  delete conf.id_token
	  conf.retry = true
	  return await Request.requestP(url, opts, conf)
	}
      }else{
	throw err
      }
    }
    return res
  }

}

module.exports = Request
