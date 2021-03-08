const axios = require('axios')
const ISO6391 = require('iso-639-1')

const getMetadata = async (title, apis) => {
  let results = {}

  if (apis.crossref) {
    const crossrefUrl = `https://api.crossref.org/works?query.bibliographic=${title}&sample=10`

    let crossrefResults
    try {
      crossrefResults = await axios.get(crossrefUrl)
    } catch (err) {
      crossrefResults = undefined
    }

    let crossref
    if (crossrefResults && crossrefResults.data.message.items) {
      crossref = crossrefResults.data.message.items.map(result => {
        let authors
        if (result.author) {
          authors = result.author.map(author => {
            return `${author.given} ${author.family}`
          })
        }

        return {
          title: result.title[0],
          type: 'Article',
          pagination: result.page,
          isPartOf: {
            issueNumber: result.issue,
            volumeNumber: result.volume,
            datePublished: result.created['date-time'],
            title: result['container-title']
              ? result['container-title'][0]
              : null
          },
          author: authors,
          inLanguage: result.language ? ISO6391.getCode(result.language) : null,
          keywords: result.subject,
          url: result.URL
        }
      })
    }

    results.crossref = crossref
  }

  if (apis.doaj) {
    const doajUrl = `https://doaj.org/api/v2/search/articles/${title}?pageSize=5`

    let doajResults
    try {
      doajResults = await axios.get(doajUrl)
    } catch (err) {
      doajResults = undefined
    }

    let doaj
    if (doajResults.data.results) {
      doajResults.data.results.map(resultjson => {
        const result = resultjson.bibjson
        let authors = result.author.map(author => {
          return author.name
        })

        let pagination
        if (result.start_page && result.end_page) {
          pagination = `${result.start_page}-${result.end_page}`
        } else if (result.start_page) {
          pagination = result.start_page.toString()
        } else if (result.end_page) {
          pagination = result.end_page.toString()
        }

        return {
          title: result.title,
          type: 'Article',
          keywords: result.keywords,
          author: authors,
          abstract: result.abstract,
          isPartOf: {
            title: result.journal.title,
            issueNumber: result.journal.number,
            volumeNumber: result.journal.volume,
            datePublished: result.month
              ? new Date(result.year, result.month, 1, 0, 0, 0, 0)
              : null
          },
          pagination: pagination,
          inLanguage: result.journal.language[0]
            ? ISO6391.getCode(result.journal.language[0])
            : null
        }
      })
    }

    results.doaj = doaj
  }

  if (apis.loc) {
    const locUrl = `https://www.loc.gov/search/?q=${title}&fo=json&sp=5`
    let locResults
    try {
      locResults = await axios.get(locUrl)
    } catch (err) {
      locResults = undefined
    }

    let loc
    if (locResults && locResults.data.results) {
      loc = locResults.data.results.map(result => {
        return {
          title: result.title,
          type: 'Article',
          keywords: result.keywords,
          abstract: result.description ? result.description[0] : null,
          isPartOf: {
            title: result.partof ? result.partof[0] : null,
            datePublished: result.dates ? result.dates[0] : null
          },
          inLanguage: result.language
            ? ISO6391.getCode(result.language[0])
            : null
        }
      })
    }

    results.loc = loc
  }

  // console.log(results)
  return results
}

module.exports = { getMetadata }
