require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken'); 

// For PDF generation and printing
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { print } = require('pdf-to-printer');

const app = express();
const PORT = process.env.PORT || 3000;

const jwtSecret = process.env.JWT_SECRET;

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
    // Format date if provided
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

If you have any further questions, please call us at +44 7392 489058 or simply reply to this email.

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

// --- New /scan Endpoint ---
// This endpoint generates a token and redirects to /order?token=...
app.get('/scan', (req, res) => {
  const payload = { scanned: true };
  // Token valid for 10 minutes
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
  res.redirect(`/order?token=${token}`);
});

// --- Protected /order Route ---
// Only serve the order page if a valid token is present
app.get('/order', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(403).send('Access denied: no token provided.');
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send('Invalid or expired token.');
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'order.html'));
  });
});

// --- Improved Order Number Generation Function (using DDMMYY) ---
function generateOrderNumber() {
  const date = new Date();
  const dd = ('0' + date.getDate()).slice(-2);
  const mm = ('0' + (date.getMonth() + 1)).slice(-2);
  const yy = String(date.getFullYear()).slice(-2);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dd}${mm}${yy}-${randomNum}`;
}

// --- PDF Generation & Printing Functions ---
function generateOrderPDF(orderData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text("Order Summary", { align: "center" });
    doc.moveDown();

    // Order info
    doc.fontSize(12).text(`Order Number: ${orderData.orderNumber}`);
    doc.text(`Table Number: ${orderData.tableNumber}`);
    doc.moveDown();

    // List ordered items
    orderData.items.forEach(item => {
      doc.text(`${item.name} x ${item.qty} - £${(item.price * item.qty).toFixed(2)}`);
    });

    doc.moveDown();
    doc.text(`Total: £${orderData.total.toFixed(2)}`, { align: "right" });
    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', err => reject(err));
  });
}

async function printOrder(orderData) {
  const outputPath = path.join(__dirname, '..', 'public', `order_${orderData.orderNumber}.pdf`);
  await generateOrderPDF(orderData, outputPath);
  // For example purposes, using "Microsoft Print to PDF"
  await print(outputPath, { printer: "Microsoft Print to PDF" });
}

// Handle order submissions
app.post('/order', async (req, res) => {
  let { tableNumber, items } = req.body;
  if (!tableNumber) return res.status(400).json({ message: "Table number is required" });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No items ordered" });
  }
  
  const orderNumber = generateOrderNumber();
  let orderText = `Order Number: ${orderNumber}\nTable: ${tableNumber}\n\nItems:\n`;
  let total = 0;
  items.forEach(item => {
    total += parseFloat(item.price) * parseInt(item.qty);
    orderText += `${item.name} x ${item.qty} - £${(parseFloat(item.price) * parseInt(item.qty)).toFixed(2)}\n`;
  });
  orderText += `\nTotal: £${total.toFixed(2)}`;

  const orderData = { tableNumber, items, orderNumber, total };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RESTAURANT_ORDER_EMAIL || process.env.EMAIL_USER,
    subject: `New Order - ${orderNumber}`,
    text: orderText,
  };

  try {
    await transporter.sendMail(mailOptions);
    await printOrder(orderData);
    res.status(200).json({ message: "Order placed successfully", orderNumber });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: "Failed to place order" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
