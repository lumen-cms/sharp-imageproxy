import {IncomingMessage, ServerResponse} from 'http'

const {send} = require('micro')
const etag = require('etag')
const sharp = require('sharp')
const request = require('request').defaults({encoding: null})
const {getConfig, parseParams} = require('./parser')

module.exports = async function (req: IncomingMessage, response: ServerResponse) {
    if (!req.url || req.url.match(/favicon.ico|logo.png|robots.txt|.css.map/g)) {
        return send(response, 400, 'File is not an image')
    }
    const [paramsErr, params] = parseParams(req.url)

    if (paramsErr) {
        return send(response, 400, 'File is not an image')
    }

    const {projectId, fileSecret, crop, resize} = params!
    const url = `https://files.graph.cool/${projectId}/${fileSecret}`
    // @ts-ignore
    const supportWebp = req.headers['Accept'] && req.headers['Accept'].indexOf('webp') !== -1
    const headerETag = req.headers['If-None-Match']
    const res: any = await requestFile(url)
    const body: any = res.body
    const headers: any = res.headers
    const contentLength = headers['content-length']
    let contentType = headers['content-type']
    let contentDisposition = headers['content-disposition']

    if (contentLength! > 25 * 1024 * 1024) {
        return send(response,
            400,
            'File too big'
        )
    }

    if (!contentType!.includes('image')) {
        return send(response,
            400,
            'File not an image'
        )
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
        response.setHeader('Content-Type', contentType)
        response.setHeader('Content-Disposition', contentDisposition)
        response.setHeader('Cache-Control', 'max-age=31536000')
        response.setHeader('Date', date)
        response.setHeader('ETag', etag(output))
        if (headerETag && headerETag === etag(output)) {
            return send(response, 304)
        }
        return send(response, 200, output)
    } catch (e) {
        return send(response, 500, e)
    }
}

/**
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
function requestFile(url: string) {
    return new Promise((resolve, reject) => {
        return request(url, {}, (err: any, res: any, body: any) => {
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

