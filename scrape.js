const { connect } = require("puppeteer-real-browser")
const axios = require("axios");
require("dotenv").config();

// Run the scraper
scrapeAppointment();

//Send a message to Telegram
// postToTelegram("New Appointment found for X country");

async function scrapeAppointment() {
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
    const email = process.env.VFS_EMAIL;
    const password = process.env.VFS_PASSWORD;
    // Navigate to the login page
    await page.goto(process.env.VFS_GLOBAL_URL, { waitUntil: "networkidle2" });
    await holdFor(10000)

    console.log("Ready to type email")
    // Enter email and password
    await page.focus("#email", {timeout: 5000});
    await page.type('#email', process.env.VFS_EMAIL, {delay: 10});
    console.log("Email done")

    await page.waitForSelector('input[formcontrolname="password"]', { visible: true });
    await page.click('input[formcontrolname="password"]');

    try {
       // Wait for the keyboard to be visible
      await page.waitForSelector('.touch-keyboard', { visible: true, timeout: 6000  });
      await page.waitForSelector('.touch-keyboard-key', { visible: true});

      await useKeyboard(page, password)

    } catch (error) {
      console.log("Keyboard unavailable.")
      console.log(error)
      console.log("Typing password directly")
      await page.focus('#password1');
      console.log("Password = " + password);
      await page.type('#password1', password);
      console.log("Password done")

    }

    console.log("Ready to click button and log in");

    // Click the login button
    await page.click('button.btn.btn-brand-orange');
    console.log("Button clicked!")
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Login successful");

    // Navigate to appointment page (adjust selectors based on actual site structure)
    await page.goto("https://visa.vfsglobal.com/gbr/en/nld/schedule-appointment", {
      waitUntil: "networkidle2",
    });

    // Extract appointment details
    // const appointmentDetails = await page.evaluate(() => {
      // Replace with the actual selector to find the appointment date and time
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


  for (let char of password) {

    if (isCapital(char)) {
      await pressKey(page, "{shift}");
      await pressKey(page, char);
      await pressKey(page, "{shift}");
    } else if(!isLetter(char)) {
      await pressKey(page, "{numeric}");
      await pressKey(page, char);
      await pressKey(page, "{alphabetic}"); // Go back to alphabet
    }
    else {
      await pressKey(page, char);
    }

  }

}

function isCapital(char) {
  return /^[A-Z]$/.test(char);
}

function isLetter(char) {
  return /^[A-Za-z]$/.test(char);
}

async function pressKey(page, keyName) {
  try {
    console.log("Attempting to press the key: " + keyName)
    await page.click(`button[name="${keyName}"]`);
    await holdFor(1000) // Wait one second
    console.log("******************************************");
    console.log("******************************************");

    console.log("Pressed the key " + keyName);

    console.log("******************************************");
    console.log("******************************************");
  }
  catch (error) {
    console.log("Key press failed for: " + keyName);
    console.log(error);
  }
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