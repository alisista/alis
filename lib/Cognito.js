let fs = require(`fs`)
let path = require(`path`)

const AmazonCognitoIdentity = require(`amazon-cognito-identity-js`)
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool
global.fetch = require(`node-fetch`);

const poolData = {    
  UserPoolId : "ap-northeast-1_HNT0fUj4J",
  ClientId : "2gri5iuukve302i4ghclh6p5rg"
}

class Cognito{
  
  static getCache(conf = {}){
    let tokens = null
    const file_path = path.resolve(`${__dirname}/../.alis/${conf.username}.json`)
    if(fs.existsSync(file_path)){
      try{
	tokens = JSON.parse(fs.readFileSync(file_path, `utf8`))
	if(tokens.id_token == undefined){
	  tokens = null
	}
      }catch(err){
	
      }
    }
    return tokens
  }
  
  static rmCache(conf = {}){
    const file_path = path.resolve(`${__dirname}/../.alis/${conf.username}.json`)
    if(fs.existsSync(file_path)){
      try{
	fs.unlinkSync(file_path)
      }catch(err){
	
      }
    }
  }
  
  static getCognitoUser(conf){
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)
    const userData = {
      Username: conf.username,
      Pool: userPool
    };
    return new AmazonCognitoIdentity.CognitoUser(userData);
  }
  
  static regTokens(session, conf, cb){
    let tokens = {
      username: conf.username,
      access_token: session.accessToken.jwtToken,
      id_token: session.idToken.jwtToken,
      refresh_token: session.refreshToken.token,
    }
    try{
      const dir_path = path.resolve(`${__dirname}/../.alis`)
      if(!fs.existsSync(dir_path)){
	fs.mkdirSync(dir_path)
      }
      const file_path = path.resolve(`${dir_path}/${conf.username}.json`)	  
      fs.writeFileSync(file_path,JSON.stringify(tokens))
    }catch(e){

    }
    cb(tokens)
  }
  
  static refreshToken(conf = {}, cb) {
    const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({RefreshToken: conf.refresh_token})
    const cognitoUser = Cognito.getCognitoUser(conf)
    cognitoUser.refreshSession(RefreshToken, (err, session) => {
      if (err) {
	cb(null)
      } else {
	Cognito.regTokens(session, conf, cb)
      }
    })
  }
  
  static async refreshTokenP(conf = {}) {
    return new Promise((res, rej)=>{
      Cognito.refreshToken(conf, res)
    })
  }
  
  static getTokens(conf, cb){
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username : conf.username,
      Password : conf.password
    })
    const cognitoUser = Cognito.getCognitoUser(conf)
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result)=> {
	Cognito.regTokens(result, conf, cb)	
      },
      onFailure: (err)=> {
	cb(null)
      }
    })
  }
  
  static async getTokensP(conf = {}) {
    return new Promise((res, rej)=>{
      Cognito.getTokens(conf, res)
    })
  }
  
}

module.exports = Cognito
