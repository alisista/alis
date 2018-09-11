# ALIS API Node.js Client

[![npm package](https://nodei.co/npm/alis.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/alis/)


## ALIS API made simple with syntax sugar

The simplest call looks like this.

```js
const alis = require('alis')

alis.articles.recent((err, json)=>{
	// do something here
})

```
The same call promisified, simply insert `.p` after `alis`.

```js
// with the promise-based calls, you are free from callback hell
alis.p.articles.recent().then((json)=>{
	//do something here
}).catch((err)=>{})

```

Another example to get all the articles an authenticated user has published on ALIS with a promisified call. It loops through all the articles successively paginating till it reaches the end, but you can put some logics between each call with a `getAll/getAllSync` function defined to make pagination easier. 

This time the example uses an `async/await` wrapper function to make it work like a synchronous code.

```js
async function getAllMyArticlesTwoAtATime(){
    // Amazon Cognito authentication is handled in the background
    // the first argument for the API parameters to pass to the HTTPS request
    // the second argument for anything else specific to this library
    await alis.p.me.articles.public({limit:2}, {username: `ocrybit`, password: `xxxxx`, getAllSync:(json, obj)=>{
    	/* obj contains some additional data for better paginating
           such as startNth, endNth, isNext, itemCount */
    	json.Items.forEach((article, index)=>{
        	console.log(`[${obj.startNth + index}] ${article.title}`)
        })
    }})
    // async/await functions execute line by line from top to bottom
    console.log(`This line comes at the end.`)
}

getAllMyArticlesTwoAtATime()
```


## Table of contents

- [Installation](#installation)
- [Available Calls](#available-calls)
- [Authentication](#authentication)
- [Syntax Sugar](#syntax-sugar)
- [More Examples](#more-examples)
- [Tests](#tests)
- [Links](#links)
- [Contributors](#contributors)


---


## Installation

Use NPM.

```js
npm i -s alis
```


---


## Available Calls

Refer to the official ALIS API documentation located [here](https://alisproject.github.io/api-docs/).

All you have to do to make a call is to replace the `slashes` with `dots` and remove `{}` from each pathname of the call. Also specify the request method in the second argument when it's not `GET`.

When authentication is needed, pass your `username` and `password` to the second argument as well.

Arguments are

`1st` parameters specified in the API document to pass to the API call.

`2nd` anything else specific to this library

`3rd` the last callback function (not for promise-based calls)

You can omit the first and second argument when not required and put the last callback function as the first argument. However, you cannot omit the first argument when you need to specify the second argument.

Some examples.

[GET] /articles/{article_id}
```js
alis.articles.article_id((err, obj)=>{})
```

[POST] /me/articles/{article_id}/like

```js
alis.me.articles.article_id.like({article_id: `2xANm0jEzLPB`}, {method: `POST`, username: `your_username`, password: `your_password`}, (err, obj)=>{})
```

Note that some `POST` and `PUT` API calls don't return anything back when successful, in that case this library returns `{statusCode: 200}` to indicate a successful operation.

---


## Authentication

ALIS uses [Amazon Cognito](https://aws.amazon.com/cognito/) to authenticate users but this library handles that in the background for you. You just need to pass your `username` and `password`, then it authenticates you through the complicated process and stores the tokens in a temporary file, it automagically refreshes your tokens when they are expired.

There are 3 ways to make API calls with authentication.

1. pass `username` and `password`
```js
alis.me.info({/*cannot be omitted when the 2nd argument exists*/}, {username: `your_username`, password: `your_password`},(err, obj)=>{})
```
2. directly pass `id_token` obtained by authentication (optionally with `username`)
```js
alis.me.info({},{id_token: `your_id_token`},(err, obj)=>{})
```
3. pass `refresh_token` and `username` (for some weired reasons)
```js
alis.me.info({},{refresh_token: `your_refresh_token`, username: `your_username`},(err, obj)=>{})
```
Note that it's a good idea to always pass your `username` since both authenticating and refreshing operations require `username` to be done automatically.

---


## Syntax Sugar

Manually paginating through articles and comments might be pain in the ass, so this library made it simpler for you.

You can specify a `getAll` function to the second argument to make the call automatically go to the next page till it reaches the end. Use `next` and `stop` functions given back to you inside the `getAll` function to navigate.

Do something asynchronous and call `next` to get the next page or `stop` to intercept the loop and finish the operation with the last callback function.

The forth object returned to you contains some useful information for pagination such as `startNth`, `endNth`, `itemCount`, `isNext`. `startNth` and `endNth` are not zero-based index but they count from 1 like ordinal numbers.

```js
let page = 0
alis.articles.popular({limit: 10},{getAll: (json, next, stop, obj)=>{
	console.log(`${obj.itemCount} articles fetched from ${obj.startNth}th to ${obj.endNth}th.`)
    page += 1
    json.Items.forEach((article, index)=>{
    	// (startNth + index) is the actuall Nth of the article over pages
    	console.log(`[${obj.startNth + index}] ${article.title}`)
    })
    // stop the calls when it's on the 3rd page so the maximum articles to get will be 30
    if(page === 3){
    	stop()
    }else{
    	next()
    }
}},(err, obj)=>{
	console.log(`This is the last callback function called when everything is done.`)
})
```

The promise based calls with `async/await` functions make it even simpler to fetch through articles. When you don't need asynchronous logic in the `getAll` function, use `getAllSync` instead so you don't have to even call `next()` to get the next page. Simply return `true` from `getAllSync` function if you want to intercept the calls before the end.

```js
async function getWithPromise(){
    let page = 0
    await alis.p.articles.popular({limit: 10},{getAllSync: (json, obj)=>{
        page += 1
        console.log(`${obj.itemCount} articles fetched from ${obj.startNth}th to ${obj.endNth}th.`)
        // return true to stop the calls
        if(page === 3){
            return true
        }
	}})
	// No need to specify the last callback function
	// things go line by line from top to bottom with async/await and promise
	console.log(`This is the last line to be executed`)
}

getWithPromise()

```
---

## More Examples

To change your profile image.

```js
const fs = require(`fs`)
const alis = require('alis')

const icon_path = `xxxxx.jpg`
// the image should be base64 encoded
const icon_base64 = fs.readFileSync(icon_path, 'base64')

// don't forget the content-type, it's a required parameter
alis.me.info.icon({icon: {icon_image: icon_base64}, "content-type": `image/jpeg`}, {method: `POST`, username: `your_username`, password: `your_password`}, (err, json, obj)=>{
    if(err == null){
        // the newly uploaded image url will be returned
        console.log(json.icon_image_url)
    }
})

// Of course you have the simpler promise version too
// alis.p.me.info.icon(...)
```
To get all the articles and likes of an arbitrary user to calculate the total number of likes.

```js
const alis = require('alis')

async function getTotalLikes(user_id){
    let articles = []
    await alis.p.users.user_id.articles.public({limit:100, user_id: user_id},{getAllSync:(json)=>{
        articles = articles.concat(json.Items)
    }})
    console.log(`${articles.length} articles found.`);
    let total_likes = 0
    for(let article of articles){
        let likes = await alis.p.articles.article_id.likes({article_id: article.article_id})
        console.log(`[${likes.count}] ${article.title}`)
        total_likes += likes.count
    }
    console.log(`${user_id} has earned ${total_likes} likes so far.`)
}

getTotalLikes(`user_id`)

```

To tip someone on an article.

```js
const fs = require(`fs`)
const alis = require('alis')

alis.me.wallet.tip({article_id: `2xANm0jEzLPB`, tip_value: 10000000000000000000}, {method: `POST`, username: `your_username`, password: `your_password`}, (err, obj)=>{})
```

---


## Tests

Tests are to be written soon.


---


## Links

- [ALIS API Documentation](https://alisproject.github.io/api-docs/)
- [ALIS WebService](https://alis.to)
- [ALIS Unofficial DISCORD Hacker Club](https://discordapp.com/invite/zKKNtUe)
- [ALIS SEARCH](https://alisista.com)
- [ALIS Articles Miner (ALIS過去記事マイナー)](https://alis.ocrybit.com)

---


## Contributors

- [OK Rabbit (@ocrybit)](https://github.com/ocrybit)


