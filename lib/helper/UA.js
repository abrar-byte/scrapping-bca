"use strict";

/**
 * Generate Random User Agent
 * Example: Mozilla/5.0 (X11; Linux x86_64; rv:110.0) Gecko/20100101 Firefox/110.0
 * @author fdciabdul
 * @date 2023-02-08
 * @returns {any}
 */
module.exports = {
  UA: function () {
    let agent = [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36" ];
    return agent[Math.floor(Math.random() * agent.length)];
  },
};