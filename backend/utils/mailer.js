const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


async function sendMail({ to, subject, html, text, from }) {
  const fromAddr = from || `"Shahu Mumbai" <${process.env.EMAIL_USER}>`;
  return transporter.sendMail({ from: fromAddr, to, subject, html, text });
}

module.exports = { transporter, sendMail };
