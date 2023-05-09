const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')();

const cheerio = require("cheerio");
const moment = require('moment');

puppeteer.use(StealthPlugin);
class BankMandiriScraper {
  constructor(corpID, user, password, noacc) {
    this.corpID = corpID;
    this.username = user;
    this.password = password;
    this.noacc = noacc;
  }

  async getSettlement(tglawal, blnawal, tglakhir, blnakhir, raw) {
    const browser = await puppeteer.launch({ headless: false,
      args: [
        '--log-level=3', // fatal only
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--mute-audio',
        '--disable-extensions',
        '--no-sandbox',  
        '--no-first-run',
        '--no-zygote',
     ],
     });
    const page = await browser.newPage();

    // Login
    await page.goto(
      "https://mib.bankmandiri.co.id/sme/common/login.do?action=doSMEMainFrame",
      { waitUntil: "networkidle2" }
    );

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; rv:112.0) Gecko/20100101 Firefox/112.0/j5hg1lrPIFtn2H");
    try {
      await page.type("input.corpId", this.corpID);
      await page.type("input.userName", this.username);
      await page.type("input.passwordEncryption", this.password);
      await page.click("input#button");
      page.on("dialog", async (dialog) => {
        await dialog.accept();
       // await this.Logout(page);
        return dialog.message();
      });

      await page.waitForNavigation();

      // Transaction Inquiry
      const transactionPage = await browser.newPage();
      transactionPage.on("dialog", async (dialog) => {
        await dialog.accept();
        await this.Logout(page);
        await browser.close();
        return dialog.message();
      });
 
      await transactionPage.goto(
        "https://mib.bankmandiri.co.id/sme/front/transactioninquiry.do?action=transactionByDateRequest",
        { waitUntil: "domcontentloaded" }
      );

      await transactionPage.reload();
      await transactionPage.waitForSelector(
        'td input[name="transferDateDay1"]'
      );
      await transactionPage.evaluate(
        (element, value) => (element.value = value),
        await transactionPage.$('td input[name="transferDateDay1"]'),
        tglawal
      );
      await transactionPage.evaluate(
        (element, value) => (element.value = value),
        await transactionPage.$('td input[name="transferDateMonth1"]'),
        blnawal
      );
      await transactionPage.evaluate(
        (element, value) => (element.value = value),
        await transactionPage.$('td input[name="transferDateDay2"]'),
        tglakhir
      );
      await transactionPage.evaluate(
        (element, value) => (element.value = value),
        await transactionPage.$('td input[name="transferDateMonth2"]'),
        blnakhir
      );
      const options = await transactionPage.$$(
        'select[name="dlAccountNo"] option'
      );

      const desiredOption = options.find(async (option) => {
        const value = await option.evaluate((node) => node.value);
        return value.includes(this.noacc);
      });
      const desiredValue = await desiredOption.evaluate((node) => node.value);
      await transactionPage.select('select[name="dlAccountNo"]', desiredValue);

      await transactionPage.click(
        "body > form > table:nth-child(4) > tbody > tr > td > input[type=button]:nth-child(2)"
      );

      await transactionPage.waitForNavigation();
      //
      const html = await transactionPage.content();
      const $ = cheerio.load(html);
      const data = [];
      const formatted = [];

      $("table.clsFormTrxStatus tr.clsEven").each((i, el) => {
        const $tds = $(el).find("td");
        const tanggalWaktu = $tds.eq(0).text().trim();
        const valueDate = $tds.eq(1).text().trim();
        const deskripsi = $tds
          .eq(2)
          .text()
          .trim()
          .replace(/\t/g, "")
          .replace(/\s+/g, " ");
        const name = this.getName(deskripsi);
        const debit = $tds.eq(3).text().trim();
        const kredit = $tds.eq(4).text().trim();
        let type;
        let nominal;
        if (parseFloat(debit.replace(',', '')) > 0 && parseFloat(kredit.replace(',', '')) === 0) {
            type = 'debit';
            nominal = debit;
          } else if (parseFloat(kredit.replace(',', '')) > 0 && parseFloat(debit.replace(',', '')) === 0) {
            type = 'kredit';
            nominal = kredit;
          }

        if (deskripsi && debit && type) {
          data.push({
            tanggalWaktu,
            valueDate,
            deskripsi,
            name,
            debit,
            kredit,
          });

          formatted.push({
            tanggal: moment(tanggalWaktu, "DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"),
            date: moment(tanggalWaktu, "DD/MM/YYYY").format("YYYY-MM-DD"),
            deskripsi: deskripsi.replace(/\.{2,}/g, ''),
            name: name,
            type : type,
            nominal : nominal.replace(/[.,]/g, "")
          });
        }
      });

      await this.Logout(page);
      await page.close();
      await transactionPage.close();
      await browser.close();
      if(raw){
        return formatted;
      }
      return data;
    } catch (error) {
      await this.Logout(page);
      await browser.close();
      console.error(error);
    } finally {
      await browser.close();
    }
  }
  async getLatestSettlement(raw) {
    const browser = await puppeteer.launch({ headless: false,
      args: [
        '--log-level=3', // fatal only
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--mute-audio',
        '--disable-extensions',
        '--no-sandbox',
  
        '--no-first-run',
        '--no-zygote',
     ],
     });
    const page = await browser.newPage();

    // Login
    await page.goto(
      "https://mib.bankmandiri.co.id/sme/common/login.do?action=doSMEMainFrame",
      { waitUntil: "networkidle2" }
    );

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; rv:112.0) Gecko/20100101 Firefox/112.0/j5hg1lrPIFtn2H");
    try {
      await page.type("input.corpId", this.corpID);
      await page.type("input.userName", this.username);
      await page.type("input.passwordEncryption", this.password);
      await page.click("input#button");
      page.on("dialog", async (dialog) => {
        await dialog.accept();
       // await this.Logout(page);
        return dialog.message();
      });

      await page.waitForNavigation();

      // Transaction Inquiry
      const transactionPage = await browser.newPage();
      transactionPage.on("dialog", async (dialog) => {
        await dialog.accept();
        await this.Logout(page);
        await browser.close();
        return dialog.message();
      });
       await transactionPage.goto(
        "https://mib.bankmandiri.co.id/sme/front/transactioninquiry.do?action=latestTransactionRequest&menuCode=MNU_GCME_040201",
        { waitUntil: "domcontentloaded" }
      );
      // await transactionPage.goto(
      //   "https://mib.bankmandiri.co.id/sme/front/transactioninquiry.do?action=transactionByDateRequest",
      //   { waitUntil: "domcontentloaded" }
      // );

      await transactionPage.reload();
      // await transactionPage.waitForSelector(
      //   'td input[name="transferDateDay1"]'
      // );
      // await transactionPage.evaluate(
      //   (element, value) => (element.value = value),
      //   await transactionPage.$('td input[name="transferDateDay1"]'),
      //   tglawal
      // );
      // await transactionPage.evaluate(
      //   (element, value) => (element.value = value),
      //   await transactionPage.$('td input[name="transferDateMonth1"]'),
      //   blnawal
      // );
      // await transactionPage.evaluate(
      //   (element, value) => (element.value = value),
      //   await transactionPage.$('td input[name="transferDateDay2"]'),
      //   tglakhir
      // );
      // await transactionPage.evaluate(
      //   (element, value) => (element.value = value),
      //   await transactionPage.$('td input[name="transferDateMonth2"]'),
      //   blnakhir
      // );
      // const options = await transactionPage.$$(
      //   'select[name="dlAccountNo"] option'
      // );

      // const desiredOption = options.find(async (option) => {
      //   const value = await option.evaluate((node) => node.value);
      //   return value.includes(this.noacc);
      // });
      // const desiredValue = await desiredOption.evaluate((node) => node.value);
      // await transactionPage.select('select[name="dlAccountNo"]', desiredValue);

      // await transactionPage.click(
      //   "body > form > table:nth-child(4) > tbody > tr > td > input[type=button]:nth-child(2)"
      // );
       await transactionPage.click(
        "input[type=button]"
      );
      await transactionPage.waitForNavigation();
      //
      const html = await transactionPage.content();
      const $ = cheerio.load(html);
      const data = [];
      const formatted = [];

      $("table.clsFormTrxStatus tr.clsEven").each((i, el) => {
        const $tds = $(el).find("td");
        const tanggalWaktu = $tds.eq(0).text().trim();
        const valueDate = $tds.eq(1).text().trim();
        const deskripsi = $tds
          .eq(2)
          .text()
          .trim()
          .replace(/\t/g, "")
          .replace(/\s+/g, " ");
        const name = this.getName(deskripsi);
        const debit = $tds.eq(3).text().trim();
        const kredit = $tds.eq(4).text().trim();
        let type;
        let nominal;
        if (parseFloat(debit.replace(',', '')) > 0 && parseFloat(kredit.replace(',', '')) === 0) {
            type = 'debit';
            nominal = debit;
          } else if (parseFloat(kredit.replace(',', '')) > 0 && parseFloat(debit.replace(',', '')) === 0) {
            type = 'kredit';
            nominal = kredit;
          }

        if (deskripsi && debit && type) {
          data.push({
            tanggalWaktu,
            valueDate,
            deskripsi,
            name,
            debit,
            kredit,
          });

          formatted.push({
            tanggal: moment(tanggalWaktu, "DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"),
            date: moment(tanggalWaktu, "DD/MM/YYYY").format("YYYY-MM-DD"),
            deskripsi: deskripsi.replace(/\.{2,}/g, ''),
            name: name,
            type : type,
            nominal : nominal.replace(/[.,]/g, "")
          });
        }
      });

      await this.Logout(page);
      await page.close();
      await transactionPage.close();
      await browser.close();
      if(raw){
        return formatted;
      }
      return data;
    } catch (error) {
      await this.Logout(page);
      await browser.close();
      console.error(error);
    } finally {
      await browser.close();
    }
  }
  getName(deskripsi) {
    const matches = deskripsi.match(/(?:KE|DARI)\s(.+)/);
    return matches ? matches[1] : null;
  }

  async Logout(page){
    await page.goto(
      "https://mib.bankmandiri.co.id/sme/common/login.do?action=logoutSME"
    );
  }
}

module.exports = BankMandiriScraper;