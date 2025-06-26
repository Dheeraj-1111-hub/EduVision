// routes/send-otp.js
const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Send OTP
router.post("/send-otp", async (req, res) => {
  console.log("Request received:", req.body); // 👈 Add this
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number missing" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins

    // Save to Supabase
    const { data, error } = await supabase
      .from("otp_codes")
      .insert([{ phone, code: otpCode, expires_at: expiresAt }]);

    if (error) {
      console.error("Supabase error:", error); // 👈 Add this
      return res.status(500).json({ error: "Database insert failed" });
    }

    // Send via Twilio
    await client.messages.create({
      body: `Your OTP is ${otpCode}`,
      from: "+1XXXXXX", // Your Twilio number
      to: phone,
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error in /send-otp:", err); // 👈 Add this
    res.status(500).json({ error: "Something went wrong" });
  }
});


// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;

  try {
    const { data, error } = await supabase
      .from("otp_codes")
      .select("code, expires_at")
      .eq("phone", phone)
      .single();

    if (error || !data) {
      console.error("Supabase Error:", error);
      return res.status(400).json({ success: false, error: "OTP not found" });
    }

    const now = new Date();
    const isExpired = new Date(data.expires_at) < now;

    if (isExpired) {
      return res.status(400).json({ success: false, error: "OTP expired" });
    }

    if (data.code !== code) {
      return res.status(400).json({ success: false, error: "Invalid OTP" });
    }

    // Optional: delete OTP after verification
    await supabase.from("otp_codes").delete().eq("phone", phone);

    return res.json({ success: true, message: "OTP Verified" });

  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});


module.exports = router;
