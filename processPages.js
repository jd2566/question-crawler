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
  };

  const browser = await puppeteer.launch(option);

  const webpage = await browser.newPage();
  await webpage.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  });

  allCategories.forEach((c) => {
    console.log(`Category: ${c.name}`);
    c.subcategories.forEach(async (s, i) => {
      await timer(i * 5000);
      console.log(`Subcategory: ${s.name}`);
      await webpage.goto(`https://zh.wikipedia.org${s.url}`);
      const pages = await webpage.$$eval(
        ".mw-content-ltr > ul > li > a",
        (elements) => {
          return elements.map((e) => {
            return { name: e.innerHTML, url: e.getAttribute("href") };
          });
        }
      );
      console.log(pages);
    });
  });

  mongoose.disconnect();
});
