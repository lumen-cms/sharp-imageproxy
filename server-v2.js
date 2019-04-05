const {createServer} = require('http')
const port = parseInt(process.env.PORT, 10) || 4444
const handler = require('./src/api/handler_v2')

/**
 *
 */
createServer(handler).listen(port, (err) => {
  if (err) throw err
  console.log(`> Ready on http://localhost:${port}`)
})
