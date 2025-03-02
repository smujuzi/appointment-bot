require('dotenv').config();
const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');

// Telegram setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function checkAppointment() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Navigate to the login page
        await page.goto('https://visa.vfsglobal.com/gbr/en/nld/login', {
            waitUntil: 'networkidle2',
        });

        // Login
        await page.type('#mat-input-0', process.env.VISA_WEBSITE_EMAIL); // Email input
        await page.type('#mat-input-1', process.env.VISA_WEBSITE_PASSWORD); // Password input
        await page.click('.submit-button'); // Login button
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Navigate to the appointment page
        await page.goto('https://visa.vfsglobal.com/gbr/en/nld/schedule-appointment', {
            waitUntil: 'networkidle2',
        });

        // Wait for the appointment section to load
        await page.waitForSelector('.appointment-availability');

        // Extract the next available appointment
        const appointmentText = await page.$eval(
            '.appointment-availability',
            (el) => el.innerText
        );

        console.log(`Next available appointment: ${appointmentText}`);

        // Send to Telegram
        await bot.sendMessage(
            process.env.TELEGRAM_CHANNEL_ID,
            `Next available appointment: ${appointmentText}`
        );
    } catch (err) {
        console.error('Error scraping appointment:', err);
        await bot.sendMessage(
            process.env.TELEGRAM_CHANNEL_ID,
            `Error checking appointment: ${err.message}`
        );
    } finally {
        await browser.close();
    }
}

// Run the scraper
checkAppointment();
