const express = require("express");
const app = express();
const port = 5000;

app.get("/otp-exoml", (req, res) => {
  const otp = req.query.otp || "000000";
  const exoml = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>Hi. Your one time password is ${otp.split("").join(" ")}. I repeat. ${otp.split("").join(" ")}. Thank you.</Say>
  </Response>`;

  res.set("Content-Type", "text/xml");
  res.send(exoml);
});

app.listen(port, () => {
  console.log(`✅ Exotel XML server running at http://localhost:${port}`);
});
