const R = require(`./ramda`)
const _apis = require(`./alis_api`)
const apis_map = {
  "/search/articles": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/search/users": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/search/tags": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/articles/recent": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/articles/popular": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/articles/eyecatch": {
    get: {
      read: true,
      write: true
    }
  },

  "/articles/recommended": {
    get: {
      read: true,
      write: true,
      pagination: true,
      by_page: true
    }
  },

  "/articles/article_id": {
    get: {
      read: true,
      write: true
    }
  },

  "/articles/article_id/alistoken": {
    get: {
      read: true,
      write: true
    }
  },
  "/articles/article_id/supporters": {},

  "/articles/article_id/likes": {
    get: {
      read: true,
      write: true
    }
  },

  "/articles/article_id/comments": {
    get: {
      read: true,
      write: true,
      pagination: true
    }
  },

  "/comments/comment_id/likes": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/articles/drafts": {
    get: {
      read: true,
      write: true,
      pagination: true
    },
    post: {}
  },

  "/me/articles/drafts/article_id": {
    post: {
      write: true
    }
  },

  "/me/articles/article_id/drafts/publish": {
    put: {}
  },

  "/me/articles/article_id/drafts/publish_with_header": {
    put: {
      write: true
    }
  },

  "/me/articles/public": {
    get: {
      read: true,
      write: true,
      pagination: true
    }
  },

  "/me/articles/article_id/public": {
    get: {
      read: true,
      write: true
    },
    put: {}
  },

  "/me/articles/article_id/public/edit": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/articles/article_id/public/unpublish": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/public/republish": {
    put: {}
  },

  "/me/articles/article_id/public/republish_with_header": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/like": {
    get: {
      read: true,
      write: true
    },
    post: {}
  },

  "/me/articles/article_id/comments": {
    post: {
      write: true
    }
  },

  "/me/articles/article_id/comments/reply": {
    post: {
      write: true
    }
  },

  "/me/articles/article_id/comments/likes": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/comments/comment_id": {
    delete: {
      write: true
    }
  },

  "/me/comments/comment_id/likes": {
    post: {
      write: true
    }
  },

  "/me/articles/article_id/fraud": {
    post: {
      write: true
    }
  },

  "/me/articles/article_id/images": {
    post: {
      "content-type": `header`
    }
  },

  "/me/articles/article_id/image_upload_url": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/info": {
    get: {
      read: true,
      write: true
    },
    put: {
      write: true
    }
  },

  "/me/info/icon": {
    post: {
      write: true,

      "content-type": `header`
    }
  },

  "/me/info/first_experiences": {
    put: {}
  },

  "/users/user_id/articles/public": {
    get: {
      read: true,
      write: true,
      pagination: true
    }
  },

  "/me/articles/article_id/drafts": {
    get: {
      read: true,
      write: true
    },
    put: {}
  },

  "/me/articles/article_id/drafts/title": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/drafts/body": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/public/title": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/public/body": {
    put: {
      write: true
    }
  },

  "/me/articles/article_id/pv": {
    post: {}
  },

  "/users/user_id/info": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/wallet/balance": {
    get: {}
  },

  "/me/wallet/tip": {
    post: {}
  },

  "/me/notifications": {
    get: {
      read: true,
      write: true,
      pagination: true
    }
  },

  "/me/unread_notification_managers": {
    get: {
      read: true,
      write: true
    },
    put: {
      read: true,
      write: true
    }
  },

  "/topics": {
    get: {
      read: true,
      write: true
    }
  },

  "/me/users/user_id/fraud": {
    post: {
      write: true
    }
  }
}

const hidden_apis = {
  "/articles/article_id/supporters": { get: { article_id: `path` } }
}
const apis = R.compose(
  R.mapObjIndexed((v, k) =>
    R.mapObjIndexed((v2, k2) =>
      R.ifElse(
        R.compose(
          R.isNotNil,
          R.path([k, k2])
        ),
        R.compose(
          R.mergeLeft(v2),
          R.fromPairs,
          R.filter(
            R.propSatisfies(
              R.includes(R.__, [
                `read`,
                `write`,
                `pagination`,
                `by_page`,
                `content-type`
              ]),
              0
            )
          ),
          R.toPairs,
          R.path([k, k2])
        ),
        R.always(v2)
      )(apis_map)
    )(v)
  ),
  R.mergeLeft(hidden_apis),
  R.renameKeysWith(R.replace(/{(.+)}/g, "$1")),
  R.mapObjIndexed(
    R.mapObjIndexed((v2, k2) =>
      R.compose(
        R.fromPairs,
        R.when(R.always(R.isNotNil(v2.security)), R.append([`auth`, true])),
        R.when(
          R.compose(
            R.gt(R.__, 1),
            R.length,
            R.filter(R.equals(`body`)),
            R.pluck(1)
          ),
          R.compose(
            R.append([`comment`, `body`]),
            R.reject(R.propEq(1, `body`))
          )
        ),
        R.map(
          R.juxt([
            R.prop(`name`),
            R.ifElse(R.propEq(`in`, `query`), R.T, R.prop(`in`))
          ])
        ),
        R.filter(v3 => {
          return R.isTrue(v3.required)
        }),
        R.propOr([], `parameters`)
      )(v2)
    )
  ),
  R.prop(`paths`)
)(_apis)

module.exports = apis
