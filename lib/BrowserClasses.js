const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
/** Main Class ScraperBank
 * @class ScraperBank
 * @date 2023-04-17
 * @param {any} user
 * @param {any} pass
 * @param {any} args
 * @returns {any}
 */
class ScraperBank {
  constructor(user, pass, args) {
    this.user = user || "username";
    this.pass = pass || "pass";
    this.konfigbrowser = args ?? {
      headless: true ,
      args: [
        '--log-level=3', // fatal only
        '--no-default-browser-check',
        '--no-sandbox',
  
        '--no-first-run',
        '--no-zygote',
     ],
     userDataDir: 'tmp',
    };
  }
  async launchBrowser() {
    try {
      const browser = await puppeteer.launch(this.konfigbrowser);
      const page = await browser.newPage();
      await this.moveMouse(page, 0, 100, 10,10, 21, 100);
      return page;
    } catch (e) {
      console.log(e);
    }
  }

  async closeBrowser(page) {
    try {
      await page.browser().close();
    } catch (e) {
      console.log(e);
    }
  }


}

module.exports = ScraperBank;
