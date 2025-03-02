const { connect } = require("puppeteer-real-browser")
require("dotenv").config();

async function test() {


    const { page } = await connect({

        headless: false,

        args: [],

        customConfig: {},

        turnstile: true,

        connectOption: {},

        disableXvfb: false,
        ignoreAllFlags: false
    })
    
    await page.goto(process.env.VFS_GLOBAL_URL, { waitUntil: "networkidle2" });

}

test()