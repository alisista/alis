const fetch = require(`node-fetch`)
const refresh_token_url = "https://alis.to/oauth2/token";

class Oauth2 {
  
  static refreshToken(conf = {}, cb) {

  const client_id = conf.client_id
  const client_secret = conf.client_secret
  if (client_id === undefined || client_secret === undefined){
    throw Error(`[OAuth] cliend_id and client_secret are required in the second argument of call`)
  }

  const token = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
  const refresh_token = conf.refresh_token
  const options = {
    body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    method: "POST",
    headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "charset": "utf-8"
    }
  }
  fetch(`${refresh_token_url}`, options).then(response => {
  r eturn response.json();
  }).then(tokens => {
    // console.log(tokens)
    cb(tokens)
  })
}

  static async refreshTokenP(conf = {}) {
    const client_id = conf.client_id
    const client_secret = conf.client_secret
    if (client_id === undefined || client_secret === undefined){
      throw Error(`[OAuth] cliend_id and client_secret are required in the second argument of call`)
    }

    const token = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
    const refresh_token = conf.refresh_token
    const options = {
      body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
      method: "POST",
      headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "charset": "utf-8"
      }
    }
    const result = await fetch(`${refresh_token_url}`, options);
    return await result.json()
  }
}

module.exports = Oauth2
