const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

async function authorizeGmail() {
    // const credentials = JSON.parse(fs.readFileSync('credentials.json'));
    const credentials = JSON.parse(fs.readFileSync('gmail-client-secret.json'));
    // const { client_secret, client_id, redirect_uris } = credentials.installed;
    const { client_secret, client_id, javascript_origins } = credentials.web;
    // const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, javascript_origins[0]);
    // const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob');
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');



    if (fs.existsSync(TOKEN_PATH)) {
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
        return oAuth2Client;
    } else {
        const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
        console.log('Authorize this app by visiting this URL:', authUrl);
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const code = await new Promise(resolve => rl.question('Enter the code from that page here: ', resolve));
        rl.close();
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        return oAuth2Client;
    }
}

async function fetchLatestOTPGmail(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    // const res = await gmail.users.messages.list({
    //     userId: 'me',
    //     q: 'subject:OTP is:unread',  // Adjust subject filter
    //     maxResults: 1
    // });
    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
        console.log('No messages found.');
        return;
    }

    for (const msg of messages) {
        const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id });

        // Extract headers and snippet
        const headers = msgData.data.payload.headers;
        const subjectHeader = headers.find(header => header.name === 'Subject');
        const fromHeader = headers.find(header => header.name === 'From');
        const snippet = msgData.data.snippet;

        console.log('---');
        console.log('Subject:', subjectHeader?.value || '(No Subject)');
        console.log('From:', fromHeader?.value || '(Unknown Sender)');
        console.log('Snippet:', snippet);
    }

    // if (!res.data.messages || res.data.messages.length === 0) {
    //     console.log('No OTP email found.');
    //     return null;
    // }

    // const msg = await gmail.users.messages.get({ userId: 'me', id: res.data.messages[0].id });
    // const bodyData = msg.data.payload.parts?.find(part => part.mimeType === 'text/plain')?.body?.data || msg.data.payload.body.data;

    // const decodedBody = Buffer.from(bodyData, 'base64').toString('utf8');
    // const otpMatch = decodedBody.match(/\b\d{6}\b/);
    // return otpMatch ? otpMatch[0] : null;
}

(async () => {
    const auth = await authorizeGmail();
    const otp = await fetchLatestOTPGmail(auth);
    if (otp) {
        console.log('OTP:', otp);
        // Puppeteer logic to enter OTP
    } else {
        console.log('OTP not found.');
    }
})();


