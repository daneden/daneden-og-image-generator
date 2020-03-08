import { NowRequest, NowResponse } from "@now/node"
import chrome from "chrome-aws-lambda"
import fs from "fs"
import path from "path"
import puppeteer from "puppeteer-core"

const loadFont = file => {
  const font = fs.readFileSync(path.join(__dirname, `../static/${file}`))
  return font.toString("base64")
}

const generateHTML = (title = "Hello world") => {
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
        src: url('data:font/woff2;base64,${loadFont(
          "AyerPosterAngular-SemiboldItalic-Web.woff2"
        )}') format('woff2');
      }

      @font-face {
        font-family: 'National 2';
        font-style: italic;
        src: url('data:font/woff2;base64,${loadFont(
          "National2Web-RegularItalic.woff2"
        )}') format('woff2');
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
        transform: translateY(-50%);
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

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: false,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle2" })
  const element = await page.$("html")
  await page.evaluateHandle("document.fonts.ready")
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

  const html = generateHTML(String(title))
  const result = await getScreenshot({ html })
  response.writeHead(200, { "Content-Type": "image/png" })
  response.end(result)
}
