const express = require("express");
const router = express.Router();

const axios = require("axios");
const cheerio = require("cheerio");

const { body, param, validationResult } = require("express-validator");

const passcode =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkRlbm55IEthdGUiLCJwYXNzd29yZCI6ImRjMmQ1MDRjYWVlNmEyMzk2Y2Q2MDQ1MmM5ZDI1NTRmIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjYyNDczNTUxLCJleHAiOjE2NjI0NzcxNTF9.XfCqeJTczFuodmaJTCpnCfUxe4c-wxS9OPi3_UL1w4U";

const checkAuth = (req, res, next) => {
  const token = req.headers["token"];

  if (!token) return res.sendStatus(403);

  if (token !== "123456789") return res.sendStatus(403);

  return next();
};

router.post(
  "/type-4",
  checkAuth,
  [body("url").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const url = req.body.url;

    const result = await axios.get(url);
    const $ = cheerio.load(result.data);
    const video_url = $("source").attr("src");

    return res.status(200).json({ url: video_url });
  }
);

module.exports = router;
