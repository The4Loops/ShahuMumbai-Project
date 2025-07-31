const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your email provider like 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Admin" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = { sendMail };
