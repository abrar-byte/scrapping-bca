const ScraperBank = require("../BrowserClasses");
const { UA } = require("../helper/UA");
const { load } = require("cheerio");
const BCASelectors = require("../helper/selector/BCASelector");
const NameExtractor = require("../helper/getName");

class ScrapBCA extends ScraperBank {
  constructor(user, pass,args) {
    super(user, pass,args);
  }

  /**
   * Login to BCA
   * @date 2023-04-17
   * @returns {any}
   */
  async login() {
    try {
      const page = await this.launchBrowser();
      await page.setUserAgent(UA());
  
      await page.goto(BCASelectors.LOGIN_PAGE.url, { waitUntil: "networkidle2" });
      await page.reload( { waitUntil: "networkidle2"});
      await page.type(BCASelectors.LOGIN_PAGE.userField, this.user , {delay :100});
      await page.type(BCASelectors.LOGIN_PAGE.passField, this.pass , {delay :100});
      await page.waitForSelector(BCASelectors.LOGIN_PAGE.submitButton);
      await page.click(BCASelectors.LOGIN_PAGE.submitButton , {delay :200});
      await this.sleep(1000);

      page.on("dialog", async dialog => {
        await dialog.accept();
        throw new Error(dialog.message());
      });

      return page;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   *  Get Settlement from selected date
   * @date 2023-04-17
   * @param {any} tglawal ( Harus berbentuk string )
   * @param {any} blnawal ( Harus berbentuk string )
   * @param {any} tglakhir ( Harus berbentuk string )
   * @param {any} blnakhir ( Harus berbentuk string )
   * @returns {any}
   */
  async getSettlement(tglawal, blnawal, tglakhir, blnakhir) {
    const page = await this.login();
    if (!page) throw new Error("Login failed");

    try {

      
      await page.goto(BCASelectors.SETTLEMENT_PAGE.url, { waitUntil: "networkidle2" });
      await page.reload( { waitUntil: "networkidle2"});
     
      await page.waitForSelector(BCASelectors.SETTLEMENT_PAGE.settlementLink);
      await page.click(BCASelectors.SETTLEMENT_PAGE.settlementLink);

      const pageTarget = page.target();
      const newTarget = await page.browser().waitForTarget(target => target.opener() === pageTarget);
      const newPage = await newTarget.page();
      await newPage.setUserAgent(UA());
      await newPage.waitForSelector("#startDt", { waitUntil: "networkidle2" });
      await newPage.reload( { waitUntil: "networkidle2"});

      const padStart2 = num => num.toString().padStart(2, "0");
      await newPage.select(BCASelectors.SETTLEMENT_PAGE.startDateField, padStart2(tglawal));
      await newPage.select(BCASelectors.SETTLEMENT_PAGE.startMonthField, blnawal.toString());
      await newPage.select(BCASelectors.SETTLEMENT_PAGE.endDateField, padStart2(tglakhir));
      await newPage.select(BCASelectors.SETTLEMENT_PAGE.endMonthField, blnakhir.toString());
      await newPage.waitForSelector(BCASelectors.SETTLEMENT_PAGE.submitButton);
      await newPage.click(BCASelectors.SETTLEMENT_PAGE.submitButton, {delay: 1500});
      await newPage.waitForNavigation();
      await newPage.waitForSelector(BCASelectors.SETTLEMENT_PAGE.settlementTable, { waitUntil: "networkidle2" });
      await page.waitForTimeout(3000);
    
      const result = await newPage.evaluate(() => document.body.innerHTML);
      const settlements = this.parseSettlement(result);
      const exists = await this.checkIfReturnToLogin(newPage, BCASelectors.LOGIN_PAGE.userField);
      if (exists) {
     throw new Error("Loopback detected");
      }
      await this.logoutAndClose(page);
      return settlements;
    } catch (error) {
      console.error(error);
      await this.logoutAndClose(page);
      throw error;
    }
  }

  /**
   * Function to logout and close browser
   * @date 2023-04-17
   * @param {any} page
   * @returns {any}
   */
  async logoutAndClose(page) {
    await page.goto(BCASelectors.LOGOUT_PAGE.url, { waitUntil: "networkidle2" });
    await this.closeBrowser(page);
  }

  /**
   * Funtion to parse settlement
   * @date 2023-04-17
   * @param {any} html
   * @returns {any}
   */
  parseSettlement(html) {
    const $ = load(html);
    const settlements = [];

    $(BCASelectors.SETTLEMENT_PAGE.settlementTable).each((i, row) => {
      if (i === 0) return; // skip table header row
      const settlement = {
        tanggal: $(row).find("td").eq(0).text().trim(),
        keterangan: $(row).find("td").eq(1).text().trim(),
        name: NameExtractor.extractBCAMutationName($(row).find("td").eq(1).text().trim()),
        cab: $(row).find("td").eq(2).text().trim(),
        nominal: $(row).find("td").eq(3).text().trim(),
        mutasi: $(row).find("td").eq(4).text().trim(),
        saldoakhir: $(row).find("td").eq(5).text().trim(),
      };
      settlements.push(settlement);
    });

    const hasilnya = settlements.filter(settlement => settlement.mutasi !== "");
    return hasilnya;
  }

  async checkIfReturnToLogin(page, selector) {
    try {
      const element = await page.$(selector);
      return element ?? null;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async  moveMouse(page, startX, startY, endX, endY, steps, delay) {
    const mouse = page.mouse;
    await mouse.move(startX, startY);
  
    const deltaX = (endX - startX) / steps;
    const deltaY = (endY - startY) / steps;
  
    for (let step = 0; step < steps; step++) {
      await this.sleep(delay);
      await mouse.move(startX + deltaX * step, startY + deltaY * step);
    }
  
    // Complete the final step
    await mouse.move(endX, endY);
  }
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = ScrapBCA;