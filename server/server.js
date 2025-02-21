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
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://www.google.com', 'https://maps.googleapis.com'],
      scriptSrc: ["'self'", 'https://maps.googleapis.com'],
      frameSrc: [
        "'self'",
        'https://www.google.com',
        'https://maps.googleapis.com',
        'https://www.google.com/maps/embed/'
      ],
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
    
    // Format the date from YYYY-MM-DD to "Day Month Year" (e.g. "22 February 2222")
    let formattedDate = date;
    if (date) {
      const bookingDate = new Date(date);
      if (!isNaN(bookingDate)) {
        formattedDate = bookingDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    
    text = `Booking Request from ${name} (${email}):
Number of People: ${people || 'N/A'}
Date: ${formattedDate || 'N/A'}
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

  // Set up mail options for sending to site owner
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: subject,
    text: text,
  };

  // Set up confirmation mail options to send back to the user with updated text
  const confirmationMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Da Gurkha Contact Form",
    text: `Thank you for reaching out.
Your message has been received, and we will get back to you shortly.

Feel free to visit us at:
114 South Rd,
Waterloo, Liverpool L22 0ND.

Our hours:
Tuesday to Saturday: 4 PM - 10 PM
Sunday & Monday: Closed.

If you have any further questions, please call us at +44 7392 489058 or simply reply to this email.

Best regards,
The Da Gurkha Team`,
  };

  try {
    // Send email to site owner
    await transporter.sendMail(mailOptions);
    // Attempt to send confirmation email to user (log error if it fails but proceed)
    try {
      await transporter.sendMail(confirmationMailOptions);
    } catch (err) {
      console.error("Error sending confirmation email:", err);
    }
    res.status(200).json({ success: true, message: "Message sent! We'll get back to you soon." });
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
