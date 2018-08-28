# sharp-imageproxy
`Sharp` serverless imageproxy which is based on Dockerfile. This project can be deployed with `zeit.co/now`

### Inspired
This project is inspired by serverless-image-proxy which runs in AWS Lambda. Its converted to run on `micro` and can be deployed simple as its based on Dockerfile

## Notes

* Images are cropped before they are resized
* Cropping starts from left-top corner

## Syntax

> URL: `DOMAIN` **/** `VERSION` **/** `PROJECT_ID` **/** `FILE_SECRET` **/** [ `CROP` **/** ] `RESIZE` [  **/** `NAME` ]

### Resize

> Format: [ `X` ] **x** [ `Y` ]

* `500x300`: Fit into 500px x 300px rectangle
* `500x300!`: Forced resize
* `500x`: Resize to 500px width maintaining aspect ratio
* `x300`: Resize to 300px height maintaining aspect ratio

#### Resize + Smartcrop

> Format: [ `X` ] **x** [ `Y` ]**[`crop`]

* All resize options
* `300x300cc`: Rectangle 300x300 and cropped centred
* `300x300catt`: Rectangle 300x300 and cropped with strategy attention
* `300x300centro`: Rectangle 300x300 and cropped with strategy enttropy

Allowed cropped options:

[`cc`==`centre`][`cn`==`north`][`cne`==`northeast`][`ce`==`east`][`cse`==`southeast`][`cs`==`south`][`csw`==`southwest`][`cw`==`west`][`cnw`==`northwest`][`centro`==`strategy.entropy`][`catt`==`strategy.attention`]

	
### Crop

> Format: `X` **x** `Y` **:** `WIDTH` **x** `HEIGHT`

* `0x0:400x400`: Crops the image taking the first 400x400 square

### Name

Name of image to improve indexing of images with search engines. 

Supported extensions: 

* png
* jpg
* jpeg
* svg
* gif
* bmp
* webp

### Install

```sh
npm install --ignore-scripts
npm run prepare
serverless deploy
```

# Deploy
```
# npm run build && now
```
