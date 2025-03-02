const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    //let movieUrl = 'https://www.imdb.com/title/tt0068646/?ref_=tt_mlt_tt_t_1';
    //let movieUrl = 'https://www.imdb.com/title/tt0111161/';

    let browser = await puppeteer.launch();

    let page = await browser.newPage();

    await page.goto(movieUrl, { waitUntil: 'networkidle2'});

    let data = await page.evaluate(() => {

        let titleElement = document.querySelector('div[class="sc-70a366cc-0 bxYZmb"] > h1');
        let title = titleElement ? titleElement.innerText : null;

        let ratingElement = document.querySelector('span[class="sc-d541859f-1 imUuxf"]');
        let rating = ratingElement ? ratingElement.innerText : null;

        let ratingCountElement = document.querySelector('div[class="sc-d541859f-3 dwhNqC"]');
        let ratingCount = ratingCountElement ? ratingCountElement.innerText : null;

        return {
            title,
            rating,
          ratingCount
        }
    });

    console.log(data);

    debugger;

    await browser.close()

})();