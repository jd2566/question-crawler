const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;

const { Category } = require("./models/category");

const toggleElm = "span.CategoryTreeToggle[title='展開']";

require("dotenv").config();
require("log-timestamp");

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

    // Go to target page
    const url = urls[parseInt(process.env.URL_INDEX)];
    console.log("Launch browser ...");
    let option = {
      headless: false,
      devtools: false,
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

    setInterval(async () => {
      await findAllSubs(webpage, currentCategory, url);
    }, 5 * 60 * 1000);

    // Start processing
    await recursiveClick(webpage, currentCategory, url);

    await browser.close();
    mongoose.disconnect();
  }
});

async function recursiveClick(page, category, currentUrl) {
  await page.$$eval(toggleElm, async (triggers) => {
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];

      await t.click();

      await new Promise(function (resolve) {
        setTimeout(resolve, 1500);
      });
    }
  });

  let count = await page.$$eval(toggleElm, (triggers) => triggers.length);

  console.log("All elements need to click: ", count);
  if (count > 0) {
    await recursiveClick(page);
  } else {
    await findAllSubs(page, category, currentUrl);
  }
}

/**
 * find all subcategories name and urls on the page.
 */
async function findAllSubs(page, targetCategory, currentUrl) {
  let subcategories = await page.$$eval(".CategoryTreeItem > a", (elements) => {
    let subs = [];
    for (let i = 0; i < elements.length; i++) {
      const e = elements[i];
      const spanText = e.nextElementSibling.innerText;

      if (spanText.includes("頁面")) {
        subs.push({ name: e.innerHTML, url: e.getAttribute("href") });
      }
    }

    return subs;
  });

  const categoryPages = await pageInfos(page);
  const subLength = subcategories.unshift({
    name: targetCategory,
    url: currentUrl,
    pages: categoryPages,
  });
  console.log(`Saving total ${subLength} subs...`);
  try {
    await Category.findOneAndUpdate(
      { name: targetCategory },
      { subcategories }
    );
  } catch (error) {
    console.log(error);
  }
}

/**
 * find all subcategories name and urls on the page.
 */
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
        !url.includes("#")
      ) {
        infos.push({ name, url });
      }
    });
    return infos;
  });
}
