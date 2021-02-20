const puppeteer = require("puppeteer");
const fs = require("fs").promises;

const toggleElm = "span.CategoryTreeToggle[title='展開']";

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

(async () => {
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

    //try {
    //  let result = await page.waitForSelector(".CategoryTreeSection").then(() => {

    //  });
    //  triggerCount = await page.$$eval("span.CategoryTreeToggle[title='展開']")
    //    .length;
    //  console.log(result);
    //} catch (error) {}

    //console.log("triggerCount: ", triggerCount);

    //triggers.forEach((t) => {
    //  //const name = t.getAttribute("data-ct-title");
    //  //console.log(name);
    //  //try {
    //  //  await page.evaluate(() => t.click());
    //  //} catch (error) {
    //  //  console.log(error);
    //  //}
    //  //console.log(`click element: ${await t.getProperties()}`);
    //  //let newSection = await page.waitForSelector(".CategoryTreeSection");
    //  //console.log("load: ", newSection);
    //});

    await browser.close();
  }
  process.exit();
})();
