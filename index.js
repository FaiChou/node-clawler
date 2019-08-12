const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')

const websiteUrl = 'https://manhua.fzdm.com/132/'

console.log('start')
request({
  url: websiteUrl,
  strictSSL: false,
}, function callback(error, response, body) {
  if (!error && response.statusCode === 200) {
    const punches = []
    const $ = cheerio.load(body)
    // li.pure-u-1-2
    //   <a>
    //   <a>
    $('li.pure-u-1-2 a').each(function(i, ele) {
      punches.push({
        id: i,
        name: $(ele).attr('title'),
        url: websiteUrl + $(ele).attr('href'),
      })
    })
    punches.forEach(function(item, index) {
      request({
        strictSSL: false,
        url: encodeURI(item.url),
      }, function(err, response, body2) {
        if (!err && response.statusCode === 200) {
          const allLinksUnfiltered = []
          // div.navigation
          //   <a>
          //   <a>
          const $$ = cheerio.load(body2)
          $$('div.navigation a').each(function(i, ele) {
            const title = $$(ele).text()
            const url = item.url + $$(ele).attr('href')
            allLinksUnfiltered.push({
              id: i,
              url,
              title,
            })
          })
          const allLinks = allLinksUnfiltered.filter(function(item, index) {
            return allLinksUnfiltered.indexOf(item) === index
          })
          punches[index].links = allLinks
          fs.writeFile('output.json', JSON.stringify(punches), function(err) {
            if (err) {
              console.log(err)
            }
          })
        } else {
          console.log('err on page:', item.url, 'code:', response.statusCode, 'msg:', err)
        }
      })
    })
  } else {
    console.log('error:', error)
  }
})
