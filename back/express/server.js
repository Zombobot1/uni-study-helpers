const express = require("express");
const serverless = require("serverless-http");
const app = express();
const cheerio = require("cheerio");
const axios = require("axios");
const cors = require("cors");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ROOT_URL = "/.netlify/functions/server";

const router = express.Router();

router.get("/word/:word", async (req, res) => {
  const r = await axios.get(
    `https://dictionary.cambridge.org/dictionary/english/${req.params.word}`
  );

  const $ = cheerio.load(r.data);
  const us_src = $(".us.dpron-i").find("amp-audio > source[type=audio/mpeg]")[0]
    .attribs["src"];

  res.json({ audio: us_src.replace("/media/english/us_pron/", "") });
});

router.get("/audio/*", async (req, res) => {
  const audio_url = req.originalUrl
    .replace(ROOT_URL, "")
    .replace("/audio/", "");

  const r = await axios.get(
    `https://dictionary.cambridge.org/media/english/us_pron/${audio_url}`,
    { responseType: "arraybuffer" }
  );

  // res.set({
  //   "Content-Type": "audio/mpeg",
  //   "Content-Length": r.data.byteLength, // does not work on netlify
  // });
  // res.end(r.data);

  res.json({ audio: r.data.toString("base64") });
});

app.use(ROOT_URL, router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
