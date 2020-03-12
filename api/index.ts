import { NowRequest, NowResponse } from "@now/node"
import chrome from "chrome-aws-lambda"
import fs from "fs"
import path from "path"
import puppeteer from "puppeteer-core"

const loadFont = file => {
  const font = fs.readFileSync(path.join(__dirname, `../static/${file}`))
  return font.toString("base64")
}

const injectFile = async (page, filePath) => {

  let contents = await new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })

  contents += `//# sourceURL=` + filePath.replace(/\n/g,'')

  return page.mainFrame().evaluate(contents)
}

const generateHTML = (title = "Hello world", host) => {
  return `<html>
    <style>
      * {
        margin: 0;
        padding: 0;
      }

      html {
        width: 1200px;
        height: 1200px;
        background-color: #F7F4ED;
      }

      body {
        position: relative;
      }

      @font-face {
        font-family: 'Ayer Poster Angular';
        font-style: italic;
        font-weight: bold;
        src: url('https://${host}/static/AyerPosterAngular-SemiboldItalic-Web.woff2');
      }

      @font-face {
        font-family: 'National 2';
        font-style: italic;
        src: url('https://${host}/static/National2Web-RegularItalic.woff2');
      }

      .title {
        font: 144px/1 "Ayer Poster Angular", serif;
        color: #FC6A00;
        max-width: 1024px;
      }

      .title p {
        position: absolute;
        top: 50%;
        left: 66px;
        transform: translateY(-55%);
        margin: 0;
      }

      .author {
        font: 36px/1 "National 2", sans-serif;
        font-style: italic;
        color: #441C17;
        transform: rotate(-90deg) translateY(300%);
        position: absolute;
        top: 50%;
        right: 0;
      }
    </style>
    
    <div class="title" style="position: relative; height: 100%; width: 100%;">
      <p>${title.replace(/ ([^ ]*)$/, "\u00A0$1")}</p>
    </div>
    
    <p class="author">Daniel Eden, Designer</p>
    
  </html>
  `
}

const getScreenshot = async function({ html, type = "png" }) {
  if (!html) {
    throw Error("You must provide an html property.")
  }
  
  // The fonts to wait on before taking screenshot
  const fontsToLoad = [
    'Ayer Poster Angular',
    'National 2',
    // 'Montserrat',
    // 'Raleway'
  ]
  
  // Build JS to wait on each font unitil it's visible
  const waitForFontFaces = `Promise.all([ '${fontsToLoad.join(`', '`)}' ].map(fontName => (new FontFaceObserver(fontName)).load()))`

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: false,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle2" })
  const element = await page.$("html")

  // Load Google Fonts
  // await page.addStyleTag({url: 'https://fonts.googleapis.com/css2?family=Lato&family=Lilita+One&family=Montez&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat+Subrayada:wght@400;700&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&family=Orbitron:wght@400;500;600;700;800;900&family=Oswald&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,669;0,700;0,800;0,900;1,400;1,500;1,600;1,669;1,700;1,800;1,900&family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700&family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap'})

  // Load and run fontfaceobserver on screenshot page
  await injectFile(page, path.join(__dirname, '../node_modules/fontfaceobserver/fontfaceobserver.standalone.js'))

  // Wait for font faces to be rendered
  await page.evaluate(waitForFontFaces)

  return await element.screenshot({ type }).then(async data => {
    await browser.close()
    return data
  })
}

export default async (request: NowRequest, response: NowResponse) => {
  const { title } = request.query

  if (!title) {
    response.status(404).end()
  }

  const html = generateHTML(String(title), request.headers['x-now-deployment-url'])
  const result = await getScreenshot({ html })
  response.writeHead(200, { "Content-Type": "image/png" })
  response.end(result)
}
