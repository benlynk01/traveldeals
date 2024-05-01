const {Firestore} = require('@google-cloud/firestore');
require('dotenv').config()
const sgMail = require('@sendgrid/mail');

const firestore = new Firestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (toEmail, subject, text) => {
    const msg = {
        to: toEmail,
        from: process.env.SENDGRID_SENDER,
        subject: subject,
        text: text,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully to', toEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

exports.notifySubscribers = async (data, context) => {
    try {
        const dealId = context.params.dealId;

        const dealDoc = await firestore.collection('deals').doc(dealId).get();
        if (!dealDoc.exists) {
            console.error('Document does not exist');
            return;
        }

        const dealData = dealDoc.data();
        const {headline, location} = dealData;

        const subscribersSnapshot = await firestore.collection('subscribers')
            .where('watch_regions', 'array-contains-any', location)
            .get();
        
        if (subscribersSnapshot.empty) {
            console.log('No subscribers found for the watched region');
            return;
        }

        subscribersSnapshot.forEach(async (subscriberDoc) => {
            const {email_address} = subscriberDoc.data();
            await sendEmail(email_address, `(Ahmad Mujaddidi): New Travel Deal! ${headline}`, `Check out this amazing travel deal: ${headline}\nLocation: ${location}`);
        });
    } catch (error) {
        console.error('Error processing document:', error);
    }
}; 