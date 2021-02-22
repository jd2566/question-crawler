const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;

const { Category } = require("./models/category");

const toggleElm = "span.CategoryTreeToggle[title='展開']";

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
  console.log("db connected! reading main categories file...");

  const mainCategoryFile = "./results/MainCategories.json";
  if (fs.access(mainCategoryFile)) {
    // Read file
    const data = await fs.readFile(mainCategoryFile, "utf8");
    const mainCategories = JSON.parse(data);
    const categories = Object.keys(mainCategories);
    const urls = Object.values(mainCategories);

    // Init Categories
    let currentCategory = categories[process.env.URL_INDEX];

    //await category.filterInsert(categories);

    // Go to target page
    const url = urls[parseInt(process.env.URL_INDEX)];
    console.log("Launch browser ...");
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
    webpage.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    await webpage.goto(`https://zh.wikipedia.org${url}`);

    // Start processing
    await clickAll(webpage);
    let count = 1;
    while (count > 0) {
      await findAllSubs(webpage, currentCategory, currentCategory);
      await webpage.waitForSelector(".CategoryTreeSection").then(async () => {
        count = await webpage.$$eval(toggleElm, (triggers) => triggers.length);
        console.log("All elements need to click: ", count);
        // Sleep before next round
        await new Promise(function (resolve) {
          setTimeout(resolve, count * 1000);
        });

        await clickAll(webpage);
      });
    }

    await browser.close();
  }
});

async function clickAll(page) {
  await page.$$eval(toggleElm, (triggers) => {
    triggers.forEach(async (t, index) => {
      // Sleep between each click
      await new Promise(function (resolve) {
        setTimeout(resolve, index * 3000);
      });

      await t.click();
    });
  });
}

/**
 * find all subcategories name and urls on the page.
 */
async function findAllSubs(page, targetCategory) {
  let subcategories = await page.$$eval(
    ".CategoryTreeEmptyBullet + a",
    (elements) => {
      return elements.map((e) => {
        return { name: e.innerHTML, url: e.getAttribute("href") };
      });
    }
  );

  await Category.findOneAndUpdate({ name: targetCategory }, { subcategories });
}
