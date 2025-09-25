import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // service: 'gmail',
  host: sandbox.smtp.mailtrap.io,
  port: 2525,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendEmail = async ({to , subject , body})=> {
    const response = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        html: body,
    })
    return response
}

export default sendEmail;