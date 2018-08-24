const apis = {

  // articles related calls
  
  "/articles/recent": {
    get: {
      pagination: true,
      by_page:true
    }
  },
  
  "/articles/popular": {
    get: {
      pagination: true,
      by_page:true
    }
  },
  
  "/users/user_id/articles/public": {
    get: {
      pagination: true,
      user_id: `path`
    }
  },
  
  "/me/articles/public": {
    get: {
      auth: true,
      pagination: true
    }
  },
  
  "/articles/article_id": {
    get: {
      article_id: `path`
    }
  },
  
  "/articles/article_id/alistoken": {
    get: {
      article_id: `path`
    }
  },
  
  "/articles/article_id/likes": {
    get: {
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/like": {
    get: {
      auth: true,
      article_id: `path`
    },
    post: {
      auth: true,
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/public": {
    get: {
      auth: true,
      article_id: `path`
    },
    put: {
      auth: true,
      article_id: `path`,
      article: `body`
    }
  },
  
  "/me/articles/article_id/fraud": {
    post: {
      auth: true,
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/pv": {
    post: {
      auth: true,
      article_id: `path`
    }
  },

  "/me/articles/article_id/images": {
    post: {
      auth:true,
      article_id: `path`,
      ArticleImage: `body`,
      "content-type": `header`
    }
  },
  
  "/me/articles/article_id/public/unpublish": {
    put: {
      auth: true,
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/public/republish": {
    put: {
      auth: true,
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/public/edit": {
    get: {
      auth: true,
      article_id: `path`
    }
  },
  
  "/me/articles/article_id/drafts": {
    get: {
      auth: true,
      article_id: `path`
    },
    put: {
      auth: true,
      article_id: `path`,
      article: `body`
    }
    
  },
  
  "/me/articles/article_id/drafts/publish": {
    put: {
      auth: true,
      article_id: `path`
    }
    
  },
  
  "/me/articles/drafts": {
    get: {
      auth: true,
      pagination: true
    },
    post: {
      auth: true,
      article: `body`
    }
  },
  
  // user info related calls
  
  "/users/user_id/info": {
    get: {
      user_id: `path`
    }
  },
  
  "/me/info": {
    get: {
      auth: true
    },
    put: {
      auth: true,
      user_info: `body`
    }
  },
  
  "/me/info/icon": {
    post: {
      auth: true,
      icon: `body`,
      "content-type": `header`      
    }
  },
  
  // wallet related calls

  "/me/wallet/balance": {
    get: {
      auth: true
    }
  },
  
  // comments related calls
  
  "/articles/article_id/comments": {
    get: {
      article_id: `path`,
      pagination: true
    }
  },
  
  "/comments/comment_id/likes": {
    get: {
      comment_id: `path`
    }
  },
  "/me/articles/article_id/comments": {
    post: {
      auth: true,
      article_id: `path`,
      comment: `body` // {"text": `comment`}
    }
  },
  "/me/articles/article_id/comments/likes": {
    get: {
      auth: true,
      article_id: `path`
    }
  },
  "/me/comments/comment_id": {
    delete: {
      auth: true,
      comment_id: `path`
    }
  },
  
  "/me/comments/comment_id/likes": {
    post: {
      auth: true,
      comment_id: `path`
    }
  },

  // notifications related calls
  
  "/me/notifications": {
    get: {
      auth: true,
      pagination: true
    }
  },
  
  "/me/unread_notification_managers": {
    get: {
      auth: true
    },
    put:{
      auth: true
    }
  }
  
}

module.exports = apis
