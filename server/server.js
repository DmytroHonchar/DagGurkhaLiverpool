require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/src', express.static(path.join(__dirname, '..', 'src')));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://www.google.com', 'https://maps.googleapis.com'],
      scriptSrc: ["'self'", 'https://maps.googleapis.com'],
      frameSrc: ["'self'", 'https://www.google.com', 'https://maps.googleapis.com', 'https://www.google.com/maps/embed/'],
      imgSrc: ["'self'", 'https://maps.gstatic.com', 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://maps.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  })
);

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many submissions from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'contact.html'));
});

app.post('/contact', contactFormLimiter, async (req, res) => {
  let { name, email, message, phone, form_type, people, date, time } = req.body;
  if (phone) return res.status(400).send('Bot detected. Submission rejected.');
  if (!name || !email) return res.status(400).send('Name and email are required');

  name = validator.escape(name.trim());
  email = validator.normalizeEmail(email.trim());
  if (!validator.isEmail(email)) return res.status(400).send('Invalid email address');

  let subject = '';
  let text = '';

  if (form_type === 'booking') {
    subject = 'New Table Booking Request';
    text = `Booking Request from ${name} (${email}):
Number of People: ${people || 'N/A'}
Date: ${date || 'N/A'}
Time: ${time || 'N/A'}
Message: ${message ? message.trim() : 'No additional message provided.'}`;
  } else {
    if (!message) return res.status(400).send('Message is required');
    subject = 'New Contact Form Submission';
    text = `Message from ${name} (${email}):
${message.trim()}`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Submission sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send submission' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'menu.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
