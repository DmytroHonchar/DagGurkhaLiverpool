require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// If you're behind a proxy (e.g., Heroku), trust it:
app.set('trust proxy', 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files from the public and src directories
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/src', express.static(path.join(__dirname, '..', 'src')));

// Optional Helmet CSP configuration
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
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Rate limit for contact form: 5 requests per 15 minutes
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

  // Honeypot check
  if (phone) {
    return res.status(400).send('Bot detected. Submission rejected.');
  }

  // Basic validation
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }

  // Sanitize
  name = validator.escape(name.trim());
  email = validator.normalizeEmail(email.trim());

  if (!validator.isEmail(email)) {
    return res.status(400).send('Invalid email address');
  }

  // Build subject & message
  let subject, text;
  if (form_type === 'booking') {
    subject = 'New Table Booking Request';
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
  } else {
    // Standard message form
    if (!message) {
      return res.status(400).send('Message is required');
    }
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

If you have any further questions, please call us at +44 7392 489058 or reply to this email.

Best regards,
The Da Gurkha Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    try {
      await transporter.sendMail(confirmationMailOptions);
    } catch (err) {
      console.error("Error sending confirmation email:", err);
    }
    return res.status(200).json({ success: true, message: "Message sent! We'll get back to you soon." });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, message: 'Failed to send submission' });
  }
});

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
});

// Serve menu page
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'menu.html'));
});

// Token-based protection for /order
app.get('/scan', (req, res) => {
  const payload = { scanned: true };
  // Token valid for 15 minutes
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.redirect(`/order?token=${token}`);
});

// Updated /order route with improved error page (text only)
app.get('/order', (req, res) => {
  const token = req.query.token;
  
  // Helper function to render a styled error page with text only
  function renderErrorPage(message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Session Error</title>
        <style>
          body { 
            background-color: #111; 
            color: #fff; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            font-family: 'Lora', sans-serif; 
            margin: 0;
          }
          .message-container {
            text-align: center;
            padding: 20px;
          }
          .message {
            background-color: #e74c3c;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            font-size: 1.2em;
          }
        </style>
      </head>
      <body>
        <div class="message-container">
          <div class="message">${message}</div>
        </div>
      </body>
      </html>
    `;
  }

  if (!token) {
    return res.status(403).send(renderErrorPage('For security purposes, please exit this page and scan the QR code again.'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send(renderErrorPage('For security purposes, your session has expired. Please exit this page and scan the QR code again.'));
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'order.html'));
  });
});

// Generate a 4-digit random order number
function generateOrderNumber() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Handle order submission
app.post('/order', async (req, res) => {
  let { tableNumber, items, orderComment, customerEmail } = req.body;

  if (!tableNumber) {
    return res.status(400).json({ message: "Table number is required" });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No items ordered" });
  }

  const orderNumber = generateOrderNumber();
  let orderText = `Order Number: ${orderNumber}\nTable: ${tableNumber}\n\nItems:\n`;
  let total = 0;

  items.forEach(item => {
    total += parseFloat(item.price) * parseInt(item.qty);
    orderText += `${item.name} x ${item.qty} - £${(item.price * item.qty).toFixed(2)}\n`;
  });
  orderText += `\nTotal: £${total.toFixed(2)}`;

  if (orderComment) {
    orderText += `\nComments: ${orderComment.trim()}`;
  }

  const ownerMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RESTAURANT_ORDER_EMAIL || process.env.EMAIL_USER,
    subject: `New Order - ${orderNumber}`,
    text: orderText,
  };

  const validEmail = customerEmail && validator.isEmail(customerEmail.trim());
  let customerMailOptions;
  if (validEmail) {
    customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail.trim(),
      subject: `Your Order Confirmation - ${orderNumber}`,
      text: `Thank you for your order!\n\nHere are your order details:\n\n${orderText}\n\nWe will notify you when your order is ready.`,
    };
  }

  try {
    await transporter.sendMail(ownerMailOptions);
    if (customerMailOptions) {
      try {
        await transporter.sendMail(customerMailOptions);
      } catch (err) {
        console.error("Error sending confirmation email to customer:", err);
      }
    }
    return res.status(200).json({ message: "Order placed successfully", orderNumber });
  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({ message: "Failed to place order" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
