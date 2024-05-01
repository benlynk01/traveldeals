const {Firestore} = require('@google-cloud/firestore');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const firestore = new Firestore();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendWelcome = async (message, context) => {
    const incomingMessage = Buffer.from(message.data, 'base64').toString('utf-8');
    const parsedMessage = JSON.parse(incomingMessage);

    console.log(`Decoded message: ${JSON.stringify(parsedMessage)}`);
    console.log(`Email address: ${parsedMessage.email_address}`);

    // Send welcome email
    const msg = {
        to: parsedMessage.email_address,
        from: process.env.SENDGRID_SENDER,
        subject: "Thanks for signing up for TravelDeals!",
        text: "Thanks for signing up. We can't wait to share deals with you.",
        html: "Thanks for signing up. We can't wait to share <strong>awesome</strong> deals with you."
    };

    sgMail.send(msg).then(() => {
        console.log("Email sent successfully to", parsedMessage.email_address);
    }).catch(error => {
        console.error("Error sending email:", error);
    });

    // Write to Firestore
    try {
        await firestore.collection('subscribers').doc(parsedMessage.email_address).set({
            email_address: parsedMessage.email_address,
            watch_regions: parsedMessage.watch_regions // assuming this is also part of the incoming message
        });
        console.log("Subscriber data written to Firestore.");
    } catch (error) {
        console.error("Error writing to Firestore:", error);
    }
};
