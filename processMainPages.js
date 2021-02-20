const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const { Category } = require("./models/category");

const toggleElm = "span.CategoryTreeToggle[title='展開']";

require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node docs)
});

async function clickAll(page) {
  await page.$$eval(toggleElm, (triggers) => {
    triggers.forEach(async (t, index) => {
      await new Promise(function (resolve) {
        setTimeout(resolve, index * 3000);
      });
      const name = t.getAttribute("data-ct-title");
      console.log(`${name} - ${index + 1}`);
      await t.click();
    });
  });
}
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST;

//connect to db
mongoose.connect(`mongodb://${user}:${pass}@${host}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async function () {
  console.log("db connected! reading main categories file...");

  const mainCategoryFile = "./results/MainCategories.json";
  if (fs.access(mainCategoryFile)) {
    const data = await fs.readFile(mainCategoryFile, "utf8");
    const mainCategories = JSON.parse(data);
    const categories = Object.keys(mainCategories);
    const urls = Object.values(mainCategories);

    const url = urls[0];

    console.log("Launch browser ...");
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
    });
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    console.log("Go to target page ...");
    await page.goto(`https://zh.wikipedia.org${url}`);

    await clickAll(page);
    let count = 1;
    while (count > 0) {
      await page.waitForSelector(".CategoryTreeSection").then(async () => {
        count = await page.$$eval(toggleElm, (triggers) => triggers.length);
        console.log("new content: ", count);
        await new Promise(function (resolve) {
          setTimeout(resolve, (count + 1) * 3000);
        });
        await clickAll(page);
      });
    }

    await browser.close();
  }
});

//const mainCategoryFile = "./results/MainCategories.json";
//if (fs.access(mainCategoryFile)) {
//  const data = await fs.readFile(mainCategoryFile, "utf8");
//  const mainCategories = JSON.parse(data);
//  const categories = Object.keys(mainCategories);
//  const urls = Object.values(mainCategories);

//  const url = urls[0];
//  console.log("Launch browser ...");
//  const browser = await puppeteer.launch({
//    headless: false,
//    slowMo: 1000,
//  });
//  const page = await browser.newPage();
//  await page.setViewport({
//    width: 1440,
//    height: 900,
//    deviceScaleFactor: 1,
//  });
//  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

//  console.log("Go to target page ...");
//  await page.goto(`https://zh.wikipedia.org${url}`);

//  await clickAll(page);
//  let count = 1;
//  while (count > 0) {
//    await page.waitForSelector(".CategoryTreeSection").then(async () => {
//      count = await page.$$eval(toggleElm, (triggers) => triggers.length);
//      console.log("new content: ", count);
//      await new Promise(function (resolve) {
//        setTimeout(resolve, (count + 1) * 3000);
//      });
//      await clickAll(page);
//    });
//  }

//  await browser.close();
//}
