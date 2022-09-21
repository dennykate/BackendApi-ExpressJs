const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["slider_image"]);

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

// categories section
router.get("/", onlyAdmin, (req, res) => {
  db.slider_image.find((err, data) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json({
      meta: {
        total: data.length,
      },
      data,
    });
  });
});

router.post(
  "/",
  onlyAdmin,
  [body("image").not().isEmpty(), body("url").not().isEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = {
      image: req.body.image,
      url: req.body.url,
    };

    db.slider_image.insert(record, (err, data) => {
      if (err) return res.sendStatus(500);

      return res.status(200).json({
        meta: {
          _id: data._id,
        },
        data,
      });
    });
  }
);

router.patch("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.slider_image.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.slider_image.update(
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

router.delete("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.slider_image.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.slider_image.remove(
          {
            _id: mongojs.ObjectId(id),
          },
          (err, data) => {
            if (err) return res.sendStatus(500);

            return res.status(200).json({
              message: "remove success",
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
