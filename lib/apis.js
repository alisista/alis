const apis = {

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
      write: true,
      article_id: `path`
    }
  },

  "/articles/article_id/alistoken": {
    get: {
      read: true,
      write: true,
      article_id: `path`
    }
  },

  "/articles/article_id/likes": {
    get: {
      read: true,
      write: true,
      article_id: `path`
    }
  },

  "/articles/article_id/comments": {
    get: {
      read: true,
      write: true,
      article_id: `path`,
      pagination: true
    }
  },

  "/comments/comment_id/likes": {
    get: {
      read: true,
      write: true,
      comment_id: `path`
    }
  },

  "/me/articles/drafts": {
    get: {
      auth: true,
      read: true,
      write: true,
      pagination: true
    },
    post: {
      auth: true,
      article: `body`
    }
  },

  "/me/articles/drafts/article_id": {
    post: {
      write: true,
      auth: true
    }
  },

  "/me/articles/article_id/drafts/publish": {
    put: {
      auth: true,
      article_id: `path`,
      publish: `body`
    }
  },

  "/me/articles/article_id/drafts/publish_with_header": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      publish: `body`
    }
  },

  "/me/articles/public": {
    get: {
      read: true,
      write: true,
      auth: true,
      pagination: true
    }
  },

  "/me/articles/article_id/public": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`
    },
    put: {
      auth: true,
      article_id: `path`,
      article: `body`
    }
  },

  "/me/articles/article_id/public/edit": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`
    }
  },

  "/me/articles/article_id/public/unpublish": {
    put: {
      write: true,
      auth: true,
      article_id: `path`
    }
  },

  "/me/articles/article_id/public/republish": {
    put: {
      auth: true,
      article_id: `path`,
      publish: `body`
    }
  },

  "/me/articles/article_id/public/republish_with_header": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      publish: `body`
    }
  },

  "/me/articles/article_id/like": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`
    },
    post: {
      auth: true,
      article_id: `path`
    }
  },

  "/me/articles/article_id/comments": {
    post: {
      write: true,
      auth: true,
      article_id: `path`,
      comment: `body` // {"text": `comment`}
    }
  },

  "/me/articles/article_id/comments/reply": {
    post: {
      write: true,
      auth: true,
      article_id: `path`,
      comment: `body` // {"text": `comment`, parent_id: `comment_id`, replyed_user_id: `user_id`}
    }
  },

  "/me/articles/article_id/comments/likes": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`
    }
  },

  "/me/comments/comment_id": {
    delete: {
      write: true,
      auth: true,
      comment_id: `path`
    }
  },

  "/me/comments/comment_id/likes": {
    post: {
      write: true,
      auth: true,
      comment_id: `path`
    }
  },

  "/me/articles/article_id/fraud": {
    post: {
      write: true,
      auth: true,
      article_id: `path`,
      Fraud: `body` // {"free_text": `text`, reason: `anything_contrary_to_public_order|nuisance|copyright_violation|slander|illegal_token_usage|illegal_act|other`, origin_url: `url`}
    }
  },

  "/me/articles/article_id/images": {
    post: {
      auth: true,
      article_id: `path`,
      ArticleImage: `body`,
      "content-type": `header`
    }
  },

  "/me/articles/article_id/image_upload_url": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`,
    }
  },

  "/me/info": {
    get: {
      read: true,
      write: true,
      auth: true
    },
    put: {
      write: true,
      auth: true,
      user_info: `body`
    }
  },

  "/me/info/icon": {
    post: {
      write: true,
      auth: true,
      icon: `body`,
      "content-type": `header`
    }
  },

  "/me/info/first_experiences": {
    put: {
      auth: true,
      user_first_experience: `body`
    }
  },

  "/users/user_id/articles/public": {
    get: {
      read: true,
      write: true,
      pagination: true,
      user_id: `path`
    }
  },

  "/me/articles/article_id/drafts": {
    get: {
      read: true,
      write: true,
      auth: true,
      article_id: `path`
    },
    put: {
      auth: true,
      article_id: `path`,
      article: `body`
    }
  },

  "/me/articles/article_id/drafts/title": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      title: `body`
    }
  },

  "/me/articles/article_id/drafts/body": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      body: `body`
    }
  },

  "/me/articles/article_id/public/title": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      title: `body`
    }
  },

  "/me/articles/article_id/public/body": {
    put: {
      write: true,
      auth: true,
      article_id: `path`,
      body: `body`
    }
  },

  "/me/articles/article_id/pv": {
    post: {
      auth: true,
      article_id: `path`
    }
  },

  "/users/user_id/info": {
    get: {
      read: true,
      write: true,
      user_id: `path`
    }
  },

  "/me/wallet/balance": {
    get: {
      auth: true
    }
  },

  "/me/wallet/tip": {
    post: {
      auth: true,
      tip: `body`
    }
  },

  "/me/notifications": {
    get: {
      read: true,
      write: true,
      auth: true,
      pagination: true
    }
  },

  "/me/unread_notification_managers": {
    get: {
      read: true,
      write: true,
      auth: true
    },
    put: {
      read: true,
      write: true,
      auth: true
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
      write: true,
      auth: true,
      user_id: `path`,
      Fraud: `body` // {"free_text": `text`, reason: `anything_contrary_to_public_order|nuisance|copyright_violation|slander|illegal_token_usage|illegal_act|other`, origin_url: `url`}
    }
  }
}

module.exports = apis
