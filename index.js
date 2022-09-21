const express = require("express");
const app = express();

const cors = require("cors");

const bodyParser = require("body-parser");

const moviesRouter = require("./api/movies");
const userRouter = require("./api/user");
const admobAdsRouter = require("./api/admob_ads");
const adsRouter = require("./api/ads");
const categoriesRouter = require("./api/categories");
const sliderImageRouter = require("./api/slider_image");
const donationImagesRouter = require("./api/donation_images");
const socialsRouter = require("./api/socials");
const actressRouter = require("./api/actress");
const scrapRouter = require("./api/scrap");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/movie", moviesRouter);
app.use("/user", userRouter);
app.use("/admob-ads", admobAdsRouter);
app.use("/ads", adsRouter);
app.use("/category", categoriesRouter);
app.use("/actress", actressRouter);
app.use("/slider-image", sliderImageRouter);
app.use("/donation-images", donationImagesRouter);
app.use("/socials", socialsRouter);
app.use("/video-url", scrapRouter);

app.listen("8000", () => {
  console.log("sever running at port 8000");
});
