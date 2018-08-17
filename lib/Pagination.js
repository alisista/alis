const apis = require(`./apis`)
const Util = require(`./Util`)
const Request = require(`./Request`)

class Response{
  constructor(opts = {}, conf = {}, json, url, cb){
    this.opts = opts
    this.conf = conf
    this.json = json
    this.url = url
    this.cb = cb
    this.LEK = this.json.LastEvaluatedKey
    this.itemCount = (this.json.Items || []).length
    if(apis[this.conf.path_name][this.conf.method || `get`].by_page !== undefined){
      this.isNext = this.itemCount >= (this.opts.limit || 20)
    }else{
      this.isNext = (this.LEK == undefined) ? false : true
    }
    if(this.itemCount === 0){
      this.startNth = 0
      this.endNth = 0
    }else{
      this.startNth = (this.conf.endNth == undefined) ? 1 : (this.conf.endNth + 1)
      this.endNth = this.startNth + this.itemCount - 1
    }
  }
  
  cpParams(opts = {}, opts2 = {}){
    for(let k in opts2){
      opts[k] = opts2[k]
    }
    if(apis[this.conf.path_name][this.conf.method || `get`].by_page !== undefined){
      opts.page = (this.opts.page || 1) + 1
    }else{
      opts.sort_key = this.LEK.sort_key || null
      opts.article_id = this.LEK.article_id || null
      opts.comment_id = this.LEK.comment_id || null
      opts.notification_id = this.LEK.notification_id || null        
      opts.score = this.LEK.score || null
      opts.evaluated_at = this.LEK.evaluated_at || null
    }
    this.conf.endNth = this.endNth
  }
}

class _Pagination extends Response{
  constructor(opts = {}, conf = {}, json, url, cb){
    super(opts, conf, json, url, cb)
  }
  stop(){
    this.cb(null,this)
  }
  
  next(opts = {}){
    if(this.isNext === false){
      this.cb(null,this)
    }else{
      this.cpParams(this.opts,opts)
      Pagination.pagination(this.opts, this.conf, this.cb)
    }
  }
}

class _PaginationP extends Response{
  constructor(opts = {}, conf = {}, json, url){
    super(opts, conf, json, url)
  }
  
  async next(opts = {}){
    if(this.isNext === false){
      return null
    }else{
      this.cpParams(this.opts,opts)
      return await Pagination.paginationP(this.opts, this.conf)
    }
  }
}

class Pagination{
  static pagination(opts = {}, conf = {}, cb){
    let url, err
    try{
      url = Util.makeUrl(opts, conf)
    }catch(err2){
      err = err2
    }
    if(err != undefined){
      cb(err)
    }else{
      Request.request(url, opts, conf, (err, json)=>{
	if(apis[conf.path_name][conf.method || `get`].pagination !== true){
	  cb(err, json)
	}else{
	  let pagination = new _Pagination(opts, conf, json, url, cb);
	  if(typeof(conf.getAll) === `function`){
	    conf.getAll(
	      (pagination.json || null),
	      (obj)=>{
		pagination.next(obj)
	      },
	      ()=>{
		pagination.stop()
	      },
	      pagination
	    )
	  }else{
	    cb(null, (pagination.json || null), pagination)
	  }
	}
      })
    }
  }  
  
  static async paginationP(opts = {}, conf = {}){
    let url = Util.makeUrl(opts, conf)
    let json = await Request.requestP(url, opts, conf)
    if(apis[conf.path_name][conf.method || `get`].pagination !== true){
      return json
    }else{
      let pagination = new _PaginationP(opts, conf, json, url)
      let isStop, nopts
      if(typeof(conf.getAll) === `function`){
	isStop = await new Promise((res, rej)=>{
	  conf.getAll(
	    pagination.json,
	    ()=>{
	      res(false)	      
	    },
	    ()=>{
	      res(true)
	    },
	    pagination
	  )
	})
	if(isStop !== true){
	  nopts = isStop
	  isStop = false
	}
      }else if(typeof(conf.getAllSync) === `function`){
	isStop = conf.getAllSync(pagination.json, pagination)
      }else{
	isStop = true
      }
      if(isStop === true || pagination.isNext === false){
	return json
      }else{
	return await pagination.next(nopts)
      }
    }
  }

}

module.exports = Pagination

