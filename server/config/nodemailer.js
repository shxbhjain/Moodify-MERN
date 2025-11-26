import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // host: 'smtp-relay.brevo.com',
  // port: 587,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default transporter;
