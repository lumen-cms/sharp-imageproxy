// const {send} = require('micro')
const coreUrl = require('url')
const etag = require('etag')
const sharp = require('sharp')
const request = require('request').defaults({encoding: null})
const {getConfig, parseParams} = require('./parser_v2')

/**
 *
 * @param {req} req
 * @param  res
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  /**
   *
   * @paramstatus
   * @param content
   * @return {*}
   */
  function send (status, content) {

    // response.setHeader('Content-Type',"text")
    // response.body(body)

    res.statusCode = status
    if (status > 304) {
      res.statusMessage = content
    }
    return res.end(content)
    // return response.end(body, status, text)
  }

  let currentUrl = req.url
  const parts = coreUrl.parse(currentUrl, true)
  const urlQueryParam = parts.query && parts.query.url
  let forwardParam = urlQueryParam || currentUrl


  if (!forwardParam || forwardParam === '/' || forwardParam.match(/favicon.ico|logo.png|robots.txt|.css.map/g)) {
    return send(400, 'File is not an image')
  }

  console.log('current path:', forwardParam)
  const [paramsErr, params] = parseParams(forwardParam)
  if (paramsErr) {
    return send(400, 'File is not an image')
  }
  const {projectId, fileSecret, crop, resize} = params
  const url = `https://files.graph.cool/${projectId}/${fileSecret}`
  // @ts-ignore
  const supportWebp = req.headers.accept && req.headers.accept.includes('webp')
  const headerETag = req.headers['If-None-Match']
  const reqFile = await requestFile(url)
  const body = reqFile.body
  const headers = reqFile.headers
  const contentLength = headers['content-length']
  let contentType = headers['content-type']
  let contentDisposition = headers['content-disposition']
  if (contentLength > 25 * 1024 * 1024) {
    return send(400, 'File too big')
  }
  if (!contentType.includes('image')) {
    return send(400, 'File not an image')
  }
  const date = headers['date']
  try {
    const stream = sharp(body)
    const output = await stream
      .metadata()
      .then(() => {
        const config = getConfig({resize, crop})
        stream.limitInputPixels(false)
        if (config.crop) {
          stream.extract({
            left: config.crop.x,
            top: config.crop.y,
            width: config.crop.width,
            height: config.crop.height
          })
        }
        if (config.resize) {
          if (config.resize.crop) {
            // stream.rotate()
            stream.resize(config.resize.width, config.resize.height)
            switch (config.resize.crop) {
              case 'cc':
                stream.crop()
                break
              case 'cn':
                stream.crop(sharp.gravity.north)
                break
              case 'cne':
                stream.crop(sharp.gravity.northeast)
                break
              case 'ce':
                stream.crop(sharp.gravity.east)
                break
              case 'cse':
                stream.crop(sharp.gravity.southeast)
                break
              case 'cs':
                stream.crop(sharp.gravity.south)
                break
              case 'csw':
                stream.crop(sharp.gravity.southwest)
                break
              case 'cw':
                stream.crop(sharp.gravity.west)
                break
              case 'cnw':
                stream.crop(sharp.gravity.northwest)
                break
              case 'centro':
                stream.crop(sharp.strategy.entropy)
                break
              case 'catt':
                stream.crop(sharp.strategy.attention)
                break
            }
          } else {
            stream.rotate()
            stream.resize(config.resize.width, config.resize.height)
            if (config.resize.force) {
              stream.ignoreAspectRatio()
            } else {
              stream.max()
            }
          }
        }
        if (supportWebp) {
          contentType = 'image/webp'
          contentDisposition = contentDisposition.replace(/jpg/g, 'webp')
          contentDisposition = contentDisposition.replace(/jpeg/g, 'webp')
          stream.webp()
        } else {
          stream.withMetadata()
        }
        return stream.toBuffer()
      })
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', contentDisposition)
    res.setHeader('Cache-Control', 'max-age=31536000')
    res.setHeader('Date', date)
    res.setHeader('ETag', etag(output))
    if (headerETag && headerETag === etag(output)) {
      return send(304)
    }
    return send(200, output)
  } catch (e) {
    return send(500, e)
  }
}

/**
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
function requestFile (url) {
  return new Promise((resolve, reject) => {
    return request(url, {}, (err, res, body) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          body,
          headers: res.headers
        })
      }
    })
  })
}
