const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["donation_images"]);

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
router.get("/", onlyAdmin, (req, res) => {
  db.donation_images.find((err, data) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json({ data });
  });
});

router.post(
  "/",
  onlyAdmin,
  [
    body("fir").not().isEmpty(),
    body("sec").not().isEmpty(),
    body("thir").not().isEmpty(),
    body("fout").not().isEmpty(),
    body("fifth").not().isEmpty(),
    body("sixth").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = {
      fir: req.body.fir,
      sec: req.body.sec,
      thir: req.body.thir,
      fout: req.body.fout,
      fifth: req.body.fifth,
      sixth: req.body.sixth,
    };

    db.donation_images.count((err, count) => {
      if (err) return res.sendStatus(500);

      if (count == 0) {
        db.donation_images.insert(record, (err, data) => {
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

  db.donation_images.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.donation_images.update(
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
