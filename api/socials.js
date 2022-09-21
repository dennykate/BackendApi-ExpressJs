const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["socials"]);

const { body, param, validationResult } = require("express-validator");

const jwt = require("jsonwebtoken");
const secret = "MaALoeMinAungHlaing";

// authorization section
const onlyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.sendStatus(403);

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer") return res.sendStatus(403);

  jwt.verify(token, secret, (err, data) => {
    if (err) return res.sendStatus(403);

    if (data.role == "admin") next();
  });
};

// donation_image section
router.get("/", (req, res) => {
  db.socials.find((err, data) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json({ data });
  });
});

router.post(
  "/",
  onlyAdmin,
  [
    body("fb_page").not().isEmpty(),
    body("messenger").not().isEmpty(),
    body("telegram_acc").not().isEmpty(),
    body("telegram_channel").not().isEmpty(),
    body("youtube").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = {
      fb_page: req.body.fb_page,
      messenger: req.body.messenger,
      telegram_acc: req.body.telegram_acc,
      telegram_channel: req.body.telegram_channel,
      youtube: req.body.youtube,
    };

    db.socials.count((err, count) => {
      if (err) return res.sendStatus(500);

      if (count == 0) {
        db.socials.insert(record, (err, data) => {
          if (err) return res.sendStatus(500);

          return res.status(200).json({
            meta: {
              _id: data._id,
            },
            data,
          });
        });
      } else {
        return res.status(200).json({
          message: "data already exist",
        });
      }
    });
  }
);

router.patch("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.socials.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.socials.update(
          { _id: mongojs.ObjectId(id) },
          { $set: req.body },
          { multi: false },
          (err, data) => {
            if (err) return res.sendStatus(500);

            return res.status(200).json({
              message: "update success",
            });
          }
        );
      } else {
        return res.sendStatus(404);
      }
    }
  );
});

module.exports = router;
