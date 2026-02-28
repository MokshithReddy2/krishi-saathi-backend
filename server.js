require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
