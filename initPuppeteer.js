const puppeteer = require("puppeteer");

console.log("Launch browser ...");
const browser = await puppeteer.launch({
  headless: false,
  slowMo: 1000,
});

const webpage = await browser.newPage();
await webpage.setViewport({
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
});

module.exports = { webpage };
