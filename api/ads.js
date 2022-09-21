const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["ads"]);

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

    return next();
  });
};

// ads section
router.post(
  "/",
  onlyAdmin,
  [
    body("id").not().isEmpty(),
    body("gif").not().isEmpty(),
    body("url").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = {
      id: req.body.id,
      gif: req.body.gif,
      url: req.body.url,
    };

    db.ads.insert(data, (err, data) => {
      if (err) return res.sendStatus(500);

      return res.status(200).json({
        meta: {
          _id: data.id,
        },
        data,
      });
    });
  }
);

router.get("/", (req, res) => {
  db.ads.find((err, data) => {
    return res.status(200).json({
      length: data.length,
      data,
    });
  });
});

router.get("/:id", [param("id").not().isEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;
  db.ads.count(
    {
      id: `${id}`,
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.ads.find(
          {
            id: `${id}`,
          },
          (err, data) => {
            if (err) return res.sendStatus(500);

            return res.status(200).json({ data });
          }
        );
      } else {
        return res.status(400).json({
          message: "file doesn't exist",
        });
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

  db.ads.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.ads.remove(
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

router.patch("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.ads.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.ads.update(
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
