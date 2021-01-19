const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  console.log("Launching...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log("Go to target page...");
  await page.goto(
    "https://zh.wikipedia.org/zh-tw/Wikipedia:%E5%88%86%E9%A1%9E%E7%B4%A2%E5%BC%95"
  );

  let html = await page.$$eval(
    "#mw-content-text > div.mw-parser-output > table > tbody > tr > td > p > a",
    (links) => {
      const result = {};

      links.forEach(function (l) {
        const title = l.getAttribute("title").split(":");
        if (title[0] === "Category") {
          result[title[1]] = l.getAttribute("href");
        }
      });

      return result;
    }
  );
  console.log(html);

  const dateTime = new Date().getTime();
  const timestamp = Math.floor(dateTime / 1000);
  const filePath = "./results/MainCategories.json";

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(err);
  }

  fs.appendFile(filePath, JSON.stringify(html), function (err) {
    if (err) throw err;
    console.log("Saved!");
  });

  await browser.close();
})();
