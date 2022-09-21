const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["user"]);

const { body, param, validationResult } = require("express-validator");

const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const secret = "MaALoeMinAungHlaing";

const checkAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.status(400).json({ message: "Fail" });

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer") return res.status(400).json({ message: "Fail" });

  jwt.verify(token, secret, (err, data) => {
    if (err) return res.status(400).json({ message: "Fail" });

    if (data.role == "admin") next();
    else return res.status(400).json({ message: "Fail" });
  });
};

router.post("/check-admin", checkAdmin, (req, res) => {
  return res.status(200).json({ message: "Success" });
});

router.post(
  "/login",
  [body("username").not().isEmpty(), body("password").not().isEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const password = crypto
      .createHash("md5")
      .update(req.body.password)
      .digest("hex");

    db.user.find(
      {
        $and: [{ username: req.body.username }, { password: password }],
      },
      (err, data) => {
        if (data[0]) {
          const user = {
            username: data[0].username,
            password: data[0].password,
            role: data[0].role,
          };

          jwt.sign(
            user,
            secret,
            {
              expiresIn: "1h",
            },
            (err, data) => {
              if (err) return res.sendStatus(404);

              return res.status(200).json({ token: data });
            }
          );
        } else {
          return res.status(400).json({
            message: "Auth Fail",
          });
        }
      }
    );
  }
);

module.exports = router;
