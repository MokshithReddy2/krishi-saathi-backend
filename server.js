require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors({
  origin: "https://krishi-saathi-beta.vercel.app/",
  methods: ["GET", "POST"],
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= SEND OTP ================= */

app.post("/send-otp", async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      "INSERT INTO farmers (name, email, mobile, password, otp) VALUES ($1,$2,$3,$4,$5)",
      [name, email, mobile, hashedPassword, otp]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Krishi Saathi OTP",
      text: `Your OTP is ${otp}`
    });

    res.json({ message: "OTP Sent Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ================= VERIFY OTP ================= */

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM farmers WHERE email=$1 AND otp=$2",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "Invalid OTP" });
    }

    await pool.query(
      "UPDATE farmers SET otp=NULL WHERE email=$1",
      [email]
    );

    res.json({ message: "Signup Successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
  const { loginType, identifier, password } = req.body;

  if (!identifier || !password) {
    return res.json({ message: "Email or Mobile required" });
  }

  try {
    let user;

    if (loginType === "email") {
      const result = await pool.query(
        "SELECT * FROM farmers WHERE email = $1",
        [identifier]
      );
      user = result.rows[0];
    } else {
      const result = await pool.query(
        "SELECT * FROM farmers WHERE mobile = $1",
        [identifier]
      );
      user = result.rows[0];
    }

    if (!user) return res.json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.json({ message: "Invalid password" });

    res.json({ message: "Login Successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
