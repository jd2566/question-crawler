const mongoose = require("mongoose");
const fs = require("fs").promises;
const { webpage } = require("./initPuppeteer");
const { Category } = require("./models/category");

const toggleElm = "span.CategoryTreeToggle[title='展開']";
const sleepTime = 3;

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
    const category = new Category();
    await category.filterInsert(categories);

    // Go to target page
    const url = urls[parseInt(process.env.URL_INDEX)];
    webpage.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    await webpage.goto(`https://zh.wikipedia.org${url}`);

    // Start processing
    await clickAll(webpage);
    let count = 1;
    while (count > 0) {
      await webpage.waitForSelector(".CategoryTreeSection").then(async () => {
        count = await webpage.$$eval(toggleElm, (triggers) => triggers.length);
        console.log("All elements need to click: ", count);
        // Sleep before next round
        await new Promise(function (resolve) {
          setTimeout(resolve, count * (sleepTime * 1000));
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
        setTimeout(resolve, index * (sleepTime * 1000));
      });

      const name = t.getAttribute("data-ct-title");
      console.log(`${name} - ${index + 1}`);
      await t.click();
    });
  });
}
