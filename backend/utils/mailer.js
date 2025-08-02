const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your email provider like 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = { sendMail };
