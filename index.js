import chalk from "chalk";
import clipboard from "clipboardy";
import puppeteer from "puppeteer-core";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const launchOptions = {
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--incognito", `--window-size=1920,1080`],
};

(async () => {
  await run();
  cron.schedule("*/20 * * * *", async () => {
    await run();
  });
})();

async function run() {
  const url = process.env.URL;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  try {
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(url, {
      timeout: 50000,
      waitUntil: ["load", "domcontentloaded", "networkidle0"],
    });
    // * Enter Username
    await page.waitForSelector("#okta-signin-username");
    await page.focus("#okta-signin-username");
    await page.keyboard.type(username);

    // * Click Submit
    await page.waitForSelector("#okta-signin-submit");
    await page.click("#okta-signin-submit");

    // * Enter Password
    await page.waitForSelector("#okta-signin-password");
    await page.focus("#okta-signin-password");
    await page.keyboard.type(password);

    // * Click Submit
    await page.waitForSelector("#okta-signin-submit");
    await page.click("#okta-signin-submit");
    await page.waitForNavigation({ waitUntil: ["networkidle0"] });

    await page.waitForTimeout(3000); // wait for cookies to load
    const cookies = await page.cookies();
    const sessionId = cookies.find(({ name }) => name === "xbaseSessionId");
    clipboard.writeSync(sessionId.value);
    console.log("SessionId: ", chalk.cyan(sessionId.value), "\n");
    await browser.close();
  } catch (error) {
    console.log(chalk.red(`Error: ${error}`));
  }
}
