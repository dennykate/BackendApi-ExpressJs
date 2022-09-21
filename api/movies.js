const express = require("express");
const router = express.Router();

const mongojs = require("mongojs");
const db = mongojs("mrpussy", ["movies", "user"]);

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

    if (data.role != "admin") return res.sendStatus(403);

    return next();
  });
};

// movies section
router.get("/", (req, res) => {
  const options = req.query;

  const filter = options.filter || {};
  const limit = 12;
  const page = parseInt(options.page) || 1;
  const skip = (page - 1) * limit;

  db.movies
    .find(filter)
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit, (err, data) => {
      if (err) return res.sendStatus(500);

      db.movies.find(filter, (err, totalData) => {
        return res.status(200).json({
          meta: {
            page: page,
            total: totalData.length,
            options,
          },
          data: data,
        });
      });
    });
});

router.get("/slug=:slug", [param("slug").not().isEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const slug = req.params.slug;

  db.movies.count(
    {
      slug: slug,
    },
    (err, count) => {
      if (count) {
        db.movies.find({ slug: slug }, (err, data) => {
          if (err) return res.sendStatus(500);

          return res.status(200).json(data);
        });
      } else {
        return res.status(400).json({
          message: "error 404",
        });
      }
    }
  );
});

router.get("/random", (req, res) => {
  db.movies.find((err, data) => {
    if (err) return res.sendStatus(500);

    let arr = [];
    for (i = 0; i < 8; i++) {
      arr.push(data[Math.floor(Math.random() * data.length)]);
    }

    return res.status(200).json(arr);
  });
});

router.get(
  "/search/name=:name",
  [param("name").not().isEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const name = req.params.name;
    const options = req.query;

    const page = options.page || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    db.movies
      .find({ slug: { $regex: `${name}` } })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit, (err, data) => {
        if (err) return res.sendStatus(500);

        db.movies.find({ slug: { $regex: `${name}` } }, (err, totalData) => {
          if (err) return res.sendStatus(500);

          return res.status(200).json({
            meta: {
              total: totalData.length,
            },
            data,
          });
        });
      });
  }
);

router.post(
  "/",
  onlyAdmin,
  [
    body("title").not().isEmpty(),
    body("duration").not().isEmpty(),
    body("size").not().isEmpty(),
    body("id").not().isEmpty(),
    body("hd").not().isEmpty(),
    body("code").not().isEmpty(),
    body("content").not().isEmpty(),
    body("category").not().isEmpty(),
    body("image").not().isEmpty(),
    body("movie").not().isEmpty(),
    body("top_rate").not().isEmpty(),
    body("type").not().isEmpty(),
    body("slug").not().isEmpty(),
    body("actress").not().isEmpty(),
    body("link").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = {
      id: req.body.id,
      hd: req.body.hd,
      title: req.body.title,
      code: req.body.code,
      category: req.body.category,
      content: req.body.content,
      size: req.body.size,
      duration: req.body.duration,
      image: req.body.image,
      movie: req.body.movie,
      top_rate: req.body.top_rate,
      type: req.body.type,
      slug: req.body.slug,
      actress: req.body.actress,
      link: req.body.link,
    };
    db.movies.insert(record, (err, data) => {
      if (err) return res.sendStatus(500);

      const _id = data._id;

      res.append("Location", "/" + _id);
      return res.status(200).json({
        meta: {
          _id: _id,
        },
        data,
      });
    });
  }
);

router.put("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(500).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.movies.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (count) {
        const record = {
          _id: mongojs.ObjectId(id),
          ...req.body,
        };

        db.movies.save(record, (err, data) => {
          if (err) return res.sendStatus(500);

          return res.status(200).json({
            meta: {
              _id: id,
            },
            data,
          });
        });
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

  db.movies.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (count) {
        db.movies.update(
          { _id: mongojs.ObjectId(id) },
          { $set: req.body },
          { multi: false },
          (err, data) => {
            if (err) {
              return res.sendStatus(500);
            }

            db.movies.find(
              {
                _id: mongojs.ObjectId(id),
              },
              (err, data) => {
                if (err) return res.sendStatus(500);

                return res.status(200).json({
                  meta: {
                    _id: id,
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

router.delete("/:id", onlyAdmin, [param("id").isMongoId()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;

  db.movies.count(
    {
      _id: mongojs.ObjectId(id),
    },
    (err, count) => {
      if (count) {
        db.movies.remove(
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
