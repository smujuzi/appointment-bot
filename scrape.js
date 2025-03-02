// const puppeteer = require('puppeteer-extra');
// const fs = require('fs');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

const { connect } = require("puppeteer-real-browser")

const axios = require("axios");
require("dotenv").config();



async function scrapeAppointment() {
  // const browser = await puppeteer.launch({ headless: false });
  // const page = await browser.newPage();
      const { browser } = await connect({
  
          headless: false,
  
          args: [],
  
          customConfig: {},
  
          turnstile: true,
  
          connectOption: {},
  
          disableXvfb: false,
          ignoreAllFlags: false
      })

      const page = await browser.newPage();

  try {
    // Navigate to the login page
    await page.goto(process.env.VFS_GLOBAL_URL, { waitUntil: "networkidle2" });
    await holdFor(10000)
    // await page.goto(process.env.VFS_GLOBAL_URL);
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // await page.mouse.move(100, 200);
    // await page.mouse.click(100, 200);

    // let html = await page.content();

    // fs.writeFileSync('vfs.html', html, 'utf-8');
    const email = process.env.VFS_EMAIL;
    const password = process.env.VFS_PASSWORD;
    
   
    console.log("Ready to type email")

    // Enter email and password
    // await page.waitForSelector("#email", { visible: true, timeout: 5000});
    await page.focus("#email", {timeout: 5000});
    await page.type('#email', process.env.VFS_EMAIL, {delay: 10});
    console.log("Email done")

    // await page.waitForSelector("#mat-input-4", { visible: true});
    // await page.focus("#mat-input-4");
    // await page.type('#mat-input-4', process.env.VFS_PASSWORD, { delay: 1000 });



    await page.waitForSelector('input[formcontrolname="password"]', { visible: true });
    console.log("Break");
    await page.click('input[formcontrolname="password"]');
    // holdFor(1000);
    console.log("Out of break");
   
    try {
      
       // Wait for the keyboard to be visible
      await page.waitForSelector('.touch-keyboard', { visible: true, timeout: 6000  });
      await page.waitForSelector('.touch-keyboard-key', { visible: true}); // 5 second timeout
      console.log("Going to try")
      /*
      body > div.cdk-overlay-container > div
      */
      await useKeyboard(page, password)

    } catch (error) {
      console.log("Keyboard unavailable.")
      console.log(error)
      console.log("Typing password directly")
      // await page.waitForSelector("#password", { visible: true, timeout: 5000});
      await page.focus('#password1');
      console.log("Password = " + process.env.VFS_PASSWORD);
      await page.type('#password1', process.env.VFS_PASSWORD);
      console.log("Password done")

    }
    


    // Shift key = {shift}
    // Numeric key = {numeric}
    //Alphabet characters = {alphabetic}

    console.log("Ready to click button and log in");

    // Click the login button
    await page.click('button.btn.btn-brand-orange');
    console.log("Button clicked!")
    // await new Promise(resolve => setTimeout(resolve, 10000)); // Wait one second
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Login successful");

    // // Navigate to appointment page (adjust selectors based on actual site structure)
    await page.goto("https://visa.vfsglobal.com/gbr/en/nld/schedule-appointment", {
      waitUntil: "networkidle2",
    });

    // // Extract appointment details
    // const appointmentDetails = await page.evaluate(() => {
    //   // Replace with the actual selector to find the appointment date and time
    //   const appointmentElement = document.querySelector(".appointment-info");
    //   return appointmentElement ? appointmentElement.textContent.trim() : "No appointment available.";
    // });

    // console.log("Appointment Details:", appointmentDetails);

    // Post to Telegram
    // await postToTelegram(appointmentDetails);

    await browser.close();
  } catch (error) {
    console.error("Error during scraping:", error);
    await browser.close();
  }
}



async  function useKeyboard(page, password) {

  let go = 0;

  for (let char of password) {
    
    if (go == 0) {
      console.log("Hereeee")
      await pressKey(page, "{shift}",go);
    }
    if (go == 5) {
      console.log("Numbersss")
      await pressKey(page, "{numeric}", go);
    }
       await pressKey(page, char,go);
    if (go == 0) {
      await pressKey(page, "{shift}", go)
    }
    go++

  }

}


async function pressKey(page, keyName, count) {
  try {
    console.log("Attempting to press the key: " + keyName)
    await page.click(`button[name="${keyName}"]`);
    await holdFor(1000) // Wait one second
    console.log("******************************************");
    console.log("******************************************");

    console.log("Pressed the key " + keyName);

    console.log("******************************************");
    console.log("******************************************");
    count++
  }
  catch (error) {
    console.log("Key press failed for: " + keyName);
    console.log(error);
  }
  return count
  
}
async function holdFor(time) {
  console.log("Waiting for " + (time / 1000) + " seconds");
  await new Promise(resolve => setTimeout(resolve, time));
}

async function postToTelegram(message) {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log("Message sent to Telegram:", response.data);
  } catch (error) {
    console.error("Error posting to Telegram:", error);
  }
}

// Run the scraper
scrapeAppointment();

//Send a message to Telegram
// postToTelegram("New Appointment found for X country");