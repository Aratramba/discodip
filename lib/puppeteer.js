/**
 * This gets the height of the component
 * and returns that to the main process
 */

const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport(Object.assign(page.viewport(), { width: 1200 }));

  /**
   * Dismiss any dialogs
   */

  page.on("dialog", async dialog => {
    await dialog.dismiss();
  });

  /**
   * Get page height
   */

  async function getHeight(url) {
    await page.goto(url);

    const height = await page.evaluate(() => {
      return document.body.getBoundingClientRect().height;
    });

    return height;
  }

  /**
   * Take screenshot
   */

  async function takeScreenshot(url, path, file) {
    await page.goto(url);
    const screenshot = await page.screenshot({
      path: path,
      type: "jpeg"
    });

    return screenshot;
  }

  /**
   * Notify process app is ready
   */

  process.send("puppeteer-ready");

  /**
   * Receive message
   */

  process.on("message", data => {
    if (data) {
      if (data.exit) {
        browser.close();
        process.exitCode = 1;
        return;
      } else if (data.url) {
        getHeight(data.url).then(height => {
          if (data.screenshot) {
            takeScreenshot(data.url, data.path, data.file).then(() => {
              process.send(height);
            });
          } else {
            process.send(height);
          }
        });
      }
    }
  });
})();
