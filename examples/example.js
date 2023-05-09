// promisifying readline
const readline = require('readline');
// const {ScrapBCA} = require("../lib/module.scraper.class.js");
const {ScrapBCA} = require("mutasi-scraper");

const { promisify } = require('util');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question[promisify.custom] = (question) => {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
};
const questionAsync = promisify(rl.question).bind(rl);

(async () => {
  const username = await questionAsync("BCA Username: ");
  const password = await questionAsync("BCA Password: ");
  const tglawal = await questionAsync("Tanggal awal: ");
  const blnawal = await questionAsync("Bulan awal: ");
  const tglakhir = await questionAsync("Tanggal akhir: ");
  const blnakhir = await questionAsync("Bulan akhir: ");

  const scraper = new ScrapBCA(username, password , {
    headless : false
  });
  scraper.getSettlement("1", "3", "24", "3").then((page) => {
    // tanggalawal,bulanawal,tanggalakhir,bulanakhir
    console.log(page);
  }).catch((e) => {
    console.log(e);
  });
  // var result = await scraper.getBCA(tglawal, blnawal, tglakhir, blnakhir);
  // console.log(result);

  // close readline interface
  rl.close();
})();
