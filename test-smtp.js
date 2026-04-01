require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP connection for:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('\n❌ SMTP Connection Failed!');
    console.error('Error:', error.message);
    console.log('\nPossible causes:');
    console.log('1. The App Password is incorrect or older than 30 days.');
    console.log('2. Two-Factor Authentication (2FA) is turned off on your Google Account.');
    console.log('3. You are using your normal Gmail password instead of a 16-character App Password.');
  } else {
    console.log('\n✅ SMTP Connection Successful!');
    console.log('Server is ready to take our messages.');
  }
});
