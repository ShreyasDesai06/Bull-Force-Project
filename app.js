require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

let otpCode; // Stores the OTP code for verification
let userOtpEntry = {}; // Stores OTP and timestamp temporarily

// Nodemailer transport setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Root route for entering email
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h2>Enter your email to receive an OTP</h2>
                <form action="/send-otp" method="POST">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                    <button type="submit">Send OTP</button>
                </form>
            </body>
        </html>
    `);
});

// Route to send OTP
app.post('/send-otp', (req, res) => {
    const email = req.body.email;
    otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP

    // Store OTP entry with timestamp for verification purposes
    userOtpEntry = {
        email,
        otp: otpCode,
        timestamp: Date.now(),
    };

    // Mail options
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otpCode}. It is valid for 5 minutes.`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send(`
                <html>
                    <body>
                        <h2>Error sending OTP. Please try again.</h2>
                        <a href="/">Go Back</a>
                    </body>
                </html>
            `);
        } else {
            console.log('Email sent: ' + info.response);
            res.send(`
                <html>
                    <body>
                        <h2>OTP sent! Please check your email.</h2>
                        <form action="/verify-otp" method="POST">
                            <input type="hidden" name="email" value="${email}">
                            <label for="otp">OTP:</label>
                            <input type="text" id="otp" name="otp" required>
                            <button type="submit">Verify OTP</button>
                        </form>
                    </body>
                </html>
            `);
        }
    });
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const currentTime = Date.now();
    const timeElapsed = currentTime - userOtpEntry.timestamp;

    // Verify if OTP matches and is within the 5-minute time limit (300,000 ms)
    if (otp === userOtpEntry.otp && timeElapsed <= 300000) {
        res.send(`
            <html>
                <body>
                    <h2>OTP verified successfully!</h2>
                    <a href="/">Go Back</a>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body>
                    <h2>Invalid or expired OTP. Try again.</h2>
                    <form action="/verify-otp" method="POST">
                        <input type="hidden" name="email" value="${email}">
                        <label for="otp">OTP:</label>
                        <input type="text" id="otp" name="otp" required>
                        <button type="submit">Verify OTP</button>
                    </form>
                </body>
            </html>
        `);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
