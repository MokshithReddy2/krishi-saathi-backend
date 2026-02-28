require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

/* ================= LOGIN ROUTE ================= */

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

    if (!user) {
      return res.json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ message: "Invalid password" });
    }

    res.json({ message: "Login Successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Backend running on port 3000");
});