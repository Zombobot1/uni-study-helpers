const app = require("./express/server");

app.listen(5000, () =>
  console.log("Listening on http://localhost:5000/.netlify/functions/server/")
);

// const html = fs.readFileSync(path.join(__dirname, "./test.html"), {
//   encoding: "utf-8",
// });
// const $ = cheerio.load(html);
