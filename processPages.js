const mongoose = require("mongoose");
const puppeteer = require("puppeteer");

const { Category } = require("./models/category");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node docs)
});

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST;

//connect to db
mongoose.connect(`mongodb://${user}:${pass}@${host}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async function () {
  console.log("db connected!");

  const allCategories = await Category.find({});

  let option = {
    headless: false,
    devtools: false,
  };

  const browser = await puppeteer.launch(option);

  let webpage = await browser.newPage();
  await webpage.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  });

  for (let index = 0; index < allCategories.length; index++) {
    const c = allCategories[index];
    console.log(`Category: ${c.name}`);

    for (let i = 0; i < c.subcategories.length; i++) {
      const s = c.subcategories[i];
      console.log(`Subcategory: ${s.name}`);

      await webpage.goto(`https://zh.wikipedia.org${c.subcategories[i].url}`);

      c.subcategories[i].pages = await pageInfos(webpage);
      console.log(c.subcategories[i]);
      await timer(5000);
    }

    await c.save();
  }

  mongoose.disconnect();
});

async function pageInfos(webpage) {
  return await webpage.$$eval("li:not([id]):not([class]) > a", (elements) => {
    let infos = [];
    elements.forEach((element) => {
      const name = element.innerText;
      const url = element.getAttribute("href");
      // filter out Category urls
      if (
        !url.includes("Category:") &&
        !url.includes("Template:") &&
        !url.includes("User:") &&
        url != "#"
      ) {
        infos.push({ name, url });
      }
    });
    return infos;
  });
}
