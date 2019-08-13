const fs = require('fs')
const cheerio = require('cheerio')
const rp = require('request-promise')

const websiteUrl = 'https://manhua.fzdm.com/132/'

async function main() {
  console.log('START')
  try {
    console.log('request for page:', websiteUrl)
    const $ = await rp({
      uri: websiteUrl,
      strictSSL: false,
      transform(body) {
        return cheerio.load(body)
      }
    })
    const punches = []
    $('li.pure-u-1-2 a').each((i, ele) => {
      punches.push({
        id: i,
        name: $(ele).attr('title'),
        url: websiteUrl + $(ele).attr('href'),
      })
    })
    const requestForSinglePage = async url => {
      console.log('request for page:', url)
      try {
        return await rp({
          uri: encodeURI(url),
          strictSSL: false,
          transform(body) {
            if (!body) {
              return false
            }
            return cheerio.load(body)
          }
        })
      } catch (error) {
        return false
      }
    }
    const pages = await Promise.all(punches.map(punch => requestForSinglePage(punch.url)))
    pages.forEach(($$, index) => {
      console.log('parse for page:', punches[index].url)
      if (!$$) {
        console.log('escape parsing for page:', punches[index].url)
        return
      }
      const allLinksUnfiltered = []
      $$('div.navigation a').each((i, ele) => {
        const title = $$(ele).text()
        const url = punches[i].url + $$(ele).attr('href')
        allLinksUnfiltered.push({
          id: i,
          url,
          title,
        })
      })
      punches[index].links = allLinksUnfiltered.filter(item => item.title !== '下一页')
    })
    const result = await Promise.all(punches.map(async punch => {
      if (!punch.links || punch.links.length === 0) {
        return {
          ...punch,
          images: []
        }
      }
      const pages = await Promise.all(punch.links.map(({url: link}) => requestForSinglePage(link)))
      const images = []
      pages.forEach(($$, idx) => {
        console.log('parse for page:', punch.links[idx].url)
        if (!$$) {
          console.log('escape parsing for page:', punch.links[idx].url)
          return
        }
        images.push($$('div#mhimg0 a img#mhpic').attr('src'))
      })
      return {
        images,
        ...punch,
      }
    }))
    console.log('write to file')
    fs.writeFile('output.json', JSON.stringify(result), function(err) {
      if (err) {
        console.log('write to file error:', err)
      }
    })
  } catch (error) {
    console.log(error)
  }
}

main()

// request({
//   url: websiteUrl,
//   strictSSL: false,
// }, function callback(error, response, body) {
//   if (!error && response.statusCode === 200) {
//     const punches = []
//     const $ = cheerio.load(body)
//     // li.pure-u-1-2
//     //   <a>
//     //   <a>
//     $('li.pure-u-1-2 a').each(function(i, ele) {
//       punches.push({
//         id: i,
//         name: $(ele).attr('title'),
//         url: websiteUrl + $(ele).attr('href'),
//       })
//     })
//     punches.forEach(function(item, index) {
//       request({
//         strictSSL: false,
//         url: encodeURI(item.url),
//       }, function(err, response, body2) {
//         if (!err && response.statusCode === 200) {
//           const allLinksUnfiltered = []
//           // div.navigation
//           //   <a>
//           //   <a>
//           const $$ = cheerio.load(body2)
//           $$('div.navigation a').each(function(i, ele) {
//             const title = $$(ele).text()
//             const url = item.url + $$(ele).attr('href')
//             allLinksUnfiltered.push({
//               id: i,
//               url,
//               title,
//             })
//           })
//           const allLinks = allLinksUnfiltered.filter(function(item, index) {
//             return allLinksUnfiltered.indexOf(item) === index
//           })
//           punches[index].links = allLinks
//           fs.writeFile('output.json', JSON.stringify(punches), function(err) {
//             if (err) {
//               console.log(err)
//             }
//           })
//         } else {
//           console.log('err on page:', item.url, 'code:', response.statusCode, 'msg:', err)
//         }
//       })
//     })
//   } else {
//     console.log('error:', error)
//   }
// })
