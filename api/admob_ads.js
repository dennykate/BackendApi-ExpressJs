const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["admob_ads"]);

const jwt = require("jsonwebtoken");
const secret = "MaALoeMinAungHlaing";

const { body, param, validationResult } = require("express-validator");

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

// admob ads section
router.post(
  "/",
  onlyAdmin,
  [
    body("banner").not().isEmpty(),
    body("native").not().isEmpty(),
    body("interstitial").not().isEmpty(),
    body("interstitial_video").not().isEmpty(),
    body("reward").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    db.admob_ads.count((err, count) => {
      if (count == 0) {
        db.admob_ads.insert(req.body, (err, data) => {
          if (err) return res.sendStatus(500);

          return res.status(200).json({
            mata: {
              _id: data._id,
            },
            data,
          });
        });
      } else {
        return res.status(400).json({
          message: "data already exist",
        });
      }
    });
  }
);

router.get("/", onlyAdmin, (req, res) => {
  db.admob_ads.find((err, data) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json({ data });
  });
});

router.patch("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.admob_ads.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (count) {
        db.admob_ads.update(
          { _id: mongojs.ObjectId(id) },
          { $set: req.body },
          { multi: false },
          (err, data) => {
            if (err) return res.sendStatus(500);

            db.admob_ads.find(
              {
                _id: mongojs.ObjectId(id),
              },
              (err, data) => {
                if (err) return res.sendStatus(500);

                return res.status(200).json({
                  meta: {
                    message: "update success",
                  },
                  data,
                });
              }
            );
          }
        );
      } else {
        return res.sendStatus(404);
      }
    }
  );
});

module.exports = router;
