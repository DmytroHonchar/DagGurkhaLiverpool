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

// If you're behind a proxy (e.g. Heroku), trust it:
app.set('trust proxy', 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/src', express.static(path.join(__dirname, '..', 'src')));

// Optional Helmet CSP configuration:
// adjust for your asset origins, fonts, etc.
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

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail password or App Password
  },
});

// Limit requests to the contact form: 5 per 15 minutes
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many submissions from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'contact.html'));
});

// Handle contact form submission
app.post('/contact', contactFormLimiter, async (req, res) => {
  let { name, email, message, phone, form_type, people, date, time } = req.body;

  // Honeypot field check
  if (phone) {
    return res.status(400).send('Bot detected. Submission rejected.');
  }

  // Basic validation
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }

  // Sanitize / normalize input
  name = validator.escape(name.trim());
  email = validator.normalizeEmail(email.trim());

  if (!validator.isEmail(email)) {
    return res.status(400).send('Invalid email address');
  }

  // Determine subject and email text content
  let subject = '';
  let text = '';

  // Booking form
  if (form_type === 'booking') {
    subject = 'New Table Booking Request';
    // Optional: you could require people, date, and time explicitly here:
    // if (!people || !date || !time) return res.status(400).send('All booking fields are required');

    text = `Booking Request from ${name} (${email}):
Number of People: ${people || 'N/A'}
Date: ${date || 'N/A'}
Time: ${time || 'N/A'}`;

  // Message form
  } else {
    if (!message) {
      return res.status(400).send('Message is required');
    }
    subject = 'New Contact Form Submission';
    text = `Message from ${name} (${email}):
${message.trim()}`;
  }

  // Set up mail options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: subject,
    text: text,
  };

  try {
    // Attempt to send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Submission sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send submission' });
  }
});

// Other routes for your site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'menu.html'));
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
