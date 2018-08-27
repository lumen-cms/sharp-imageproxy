"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { send } = require('micro');
const etag = require('etag');
const sharp = require('sharp');
const request = require('request').defaults({ encoding: null });
const { getConfig, parseParams } = require('./parser');
module.exports = function (req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(req.url);
        if (!req.url) {
            return send(response, 400, 'File is not an image');
        }
        const [paramsErr, params] = parseParams(req.url);
        if (paramsErr) {
            return send(response, 400, 'File is not an image');
        }
        const { projectId, fileSecret, crop, resize } = params;
        const url = `https://files.graph.cool/${projectId}/${fileSecret}`;
        // @ts-ignore
        const supportWebp = req.headers['Accept'] && req.headers['Accept'].indexOf('webp') !== -1;
        const headerETag = req.headers['If-None-Match'];
        const res = yield requestFile(url);
        const body = res.body;
        const headers = res.headers;
        const contentLength = headers['content-length'];
        let contentType = headers['content-type'];
        let contentDisposition = headers['content-disposition'];
        if (contentLength > 25 * 1024 * 1024) {
            return send(response, 400, 'File too big');
        }
        if (!contentType.includes('image')) {
            return send(response, 400, 'File not an image');
        }
        const date = headers['date'];
        try {
            const stream = sharp(body);
            const output = yield stream
                .metadata()
                .then(meta => {
                const config = getConfig({ resize, crop });
                stream.limitInputPixels(false);
                if (config.crop) {
                    stream.extract({
                        left: config.crop.x,
                        top: config.crop.y,
                        width: config.crop.width,
                        height: config.crop.height,
                    });
                }
                if (config.resize) {
                    if (config.resize.crop) {
                        // stream.rotate()
                        stream.resize(config.resize.width, config.resize.height);
                        switch (config.resize.crop) {
                            case 'cc':
                                stream.crop();
                                break;
                            case 'cn':
                                stream.crop(sharp.gravity.north);
                                break;
                            case 'cne':
                                stream.crop(sharp.gravity.northeast);
                                break;
                            case 'ce':
                                stream.crop(sharp.gravity.east);
                                break;
                            case 'cse':
                                stream.crop(sharp.gravity.southeast);
                                break;
                            case 'cs':
                                stream.crop(sharp.gravity.south);
                                break;
                            case 'csw':
                                stream.crop(sharp.gravity.southwest);
                                break;
                            case 'cw':
                                stream.crop(sharp.gravity.west);
                                break;
                            case 'cnw':
                                stream.crop(sharp.gravity.northwest);
                                break;
                            case 'centro':
                                stream.crop(sharp.strategy.entropy);
                                break;
                            case 'catt':
                                stream.crop(sharp.strategy.attention);
                                break;
                        }
                    }
                    else {
                        stream.rotate();
                        stream.resize(config.resize.width, config.resize.height);
                        if (config.resize.force) {
                            stream.ignoreAspectRatio();
                        }
                        else {
                            stream.max();
                        }
                    }
                }
                if (supportWebp) {
                    contentType = 'image/webp';
                    contentDisposition = contentDisposition.replace(/jpg/g, 'webp');
                    contentDisposition = contentDisposition.replace(/jpeg/g, 'webp');
                    stream.webp();
                }
                else {
                    stream.withMetadata();
                }
                return stream.toBuffer();
            });
            const base64Img = output.toString('base64');
            //         'Date': date,
            //         'ETag': etag
            response.setHeader('Content-Type', contentType);
            response.setHeader('Content-Disposition', contentDisposition);
            response.setHeader('Cache-Control', 'max-age=31536000');
            response.setHeader('Date', date);
            response.setHeader('ETag', etag(base64Img));
            // const r = base64Response({
            //     body: base64Img,
            //     date,
            //     contentType,
            //     contentDisposition,
            //     etag: etag(base64Img),
            //     headerETag
            // });
            return send(response, 200, output);
        }
        catch (e) {
            return send(response, 500, e);
        }
    });
};
/**
 *
 * @param {string} path
 */
// function parsePath(path: string) {
//     path = path.replace('/image', '')
//     const sections = path.split('/').filter(e => e)
//     if (sections.length > 1) {
//         return {
//             url: `https://files.graph.cool/${sections[0]}/${sections[1]}`
//         }
//     } else {
//         // fallback for testing purpose
//         return {url: 'https://files.graph.cool/cj7r5j1a30jsl0132374v5q2z/cjam6e2mu00rq01373cpgohu9'}
//     }
// }
/**
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
function requestFile(url) {
    return new Promise((resolve, reject) => {
        return request(url, {}, (err, res, body) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    body,
                    headers: res.headers
                });
            }
        });
    });
}
/**
 *
 * @param {any} body
 * @param {any} date
 * @param {any} contentType
 * @param {any} contentDisposition
 * @param {any} etag
 * @returns {{statusCode: number; headers: {"Content-Type": any; "Content-Disposition": any; "Cache-Control": string; Date: any; ETag: any}; body: any; isBase64Encoded: boolean}}
 */
// function base64Response({body, date, contentType, contentDisposition, etag, headerETag}) {
//     const headers = {
//         'Content-Type': contentType,
//         'Content-Disposition': contentDisposition,
//         'Cache-Control': 'max-age=31536000', //31536000
//         'Date': date,
//         'ETag': etag
//     };
//     if (headerETag && headerETag === etag) {
//         return {
//             statusCode: 304,
//             headers
//         }
//     }
//     return {
//         statusCode: 200,
//         headers,
//         body,
//         isBase64Encoded: true,
//     };
// }
//# sourceMappingURL=handler.js.map