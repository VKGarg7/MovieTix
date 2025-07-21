import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// const sendEmail = async ({to , subject , body})=> {
//     const response = await transporter.sendMail({
//         from: process.env.GMAIL_USER,
//         to,
//         subject,
//         html: body,
//     })
//     return response
// }

const sendEmail = async ({ to, subject, body }) => {
    try {
        const response = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject,
            html: body,
        });

        console.log("✅ Email Sent Successfully:");
        console.log(response);  // This will show MessageId, accepted, rejected, etc.

        return response;
    } catch (error) {
        console.error("❌ Email Sending Failed:");
        console.error(error);   // This will show error details like SMTP issues
        throw error;            // Re-throw so the caller knows it failed
    }
};


export default sendEmail;