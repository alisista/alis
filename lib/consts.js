module.exports = {
  REFRESH_TOKEN_URL: `https://alis.to/oauth2/token`,
  API_ENDPOINT: `https://alis.to/api`,
  OAUTH_API_ENDPOINT: `https://alis.to/oauth2api`,
  ALLOWED_PARAM_NAMES: [
    `method`,
    `id_token`,
    `getAll`,
    `getAllSync`,
    `username`,
    `password`,
    `access_token`,
    `refresh_token`,
    `client_id`,
    `client_secret`,
    `scope`
  ],
  COPY_FIELDS: [
    `sort_key`,
    `article_id`,
    `comment_id`,
    `notification_id`,
    `score`,
    `evaluated_at`
  ],
  POOL_DATA: {
    UserPoolId: "ap-northeast-1_HNT0fUj4J",
    ClientId: "2gri5iuukve302i4ghclh6p5rg"
  }
}
