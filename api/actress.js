const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["actress"]);

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

// actress section
router.get("/", (req, res) => {
  const options = req.query;

  const filter = options.filter || {};
  const page = parseInt(options.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  db.actress
    .find(filter)
    .sort({ title: 1 })
    .skip(skip)
    .limit(limit, (err, data) => {
      if (err) return res.sendStatus(500);

      db.actress.find((err, totalData) => {
        return res.status(200).json({
          meta: {
            total: totalData.length,
            page: page,
          },
          data,
        });
      });
    });
});

router.get("/:slug", (req, res) => {
  const slug = req.params.slug;

  db.actress.count({ slug: slug }, (err, count) => {
    if (err) return res.sendStatus(500);

    if (count) {
      db.actress.find({ slug: slug }, (err, data) => {
        if (err) return res.sendStatus(500);

        return res.status(200).json(data);
      });
    } else {
      return res.status(400).json({
        message: "Fail",
      });
    }
  });
});

router.post(
  "/",
  onlyAdmin,
  [
    body("id").not().isEmpty(),
    body("image").not().isEmpty(),
    body("title").not().isEmpty(),
    body("slug").not().isEmpty(),
    body("rate").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = {
      id: req.body.id,
      image: req.body.image,
      title: req.body.title,
      slug: req.body.slug,
      rate: req.body.rate,
    };

    db.actress.insert(record, (err, data) => {
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

  db.actress.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.actress.update(
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

  db.actress.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (err) return res.sendStatus(500);

      if (count) {
        db.actress.remove(
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
