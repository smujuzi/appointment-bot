const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';

//Run getToken
// getOTP();

async function getOTP() {
    const auth = await authorizeGmail();
    const otp = await fetchLatestOTPGmail(auth);
    console.log("The OTP: ", otp);
    
    return otp
}

async function authorizeGmail() {
    const credentials = JSON.parse(fs.readFileSync('s-credentials.json'));
    const { client_secret, client_id, javascript_origins } = credentials.web;
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
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:One Time Password is:unread',
        maxResults: 1
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
        console.log('No messages found.');
        return;
    }
    msg = messages[0]


    const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id });


    const bodyData = msgData.data.payload.parts?.find(part => part.mimeType === 'text/plain')?.body?.data || msgData.data.payload.body.data; // get the text body of the email
    const decodedBody = Buffer.from(bodyData, 'base64').toString('utf8'); //gmail encodes email body content in base64 for safe transmission. Converts the base-64 string into a buffer and then into a string (readable text)
    const otpMatch = decodedBody.match(/\b\d{6}\b/);
    /*
    Regex specifically looks for a 6 digit number
    \b — Word boundary, ensuring that the 6 digits are not part of a larger number or word. It matches the position between a word character (like a letter or digit) and a non-word character (like space, punctuation, etc.).

    \d{6} — Matches exactly 6 digits (0-9).

    \b — Another word boundary, ensuring that the 6 digits are followed by a non-word character or the end of the string.
    */

    console.log('---');
    console.log('---');
    console.log('bodyData:', bodyData);
    console.log('decodedBody:', decodedBody);
    console.log('otpMatch:', otpMatch);
    
    if (otpMatch) {
        await markEmailAsRead(auth,msg.id)
    }
    return otpMatch ? otpMatch[0] : null;
}

async function markEmailAsRead(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    try {
        // Modify the labels for the message to mark it as read
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            resource: {
                removeLabelIds: ['UNREAD'], // Removes the 'UNREAD' label
            }
        });
        console.log(`Email with message ID ${messageId} marked as read.`);
    } catch (error) {
        console.error('Error marking email as read:', error);
    }
}

module.exports = {
    authorizeGmail,
    fetchLatestOTPGmail,
    markEmailAsRead,
    getOTP
};

