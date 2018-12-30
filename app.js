const express = require("express"),
      app = express(),
      bodyParser = require("body-parser");
      snoowrap = require("snoowrap"),
      URL = require("url").URL,
      reddit = require("./search");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

const authUrl = snoowrap.getAuthUrl({
  clientId: process.env.CLIENT_ID,
  scope: ["identity", "history"],
  redirectUri: "http://localhost:8080/auth",
  permanent: false,
  state: "hello"
});

let snooPromise;
let content;

app.get("/", function(req, res) {
  if (snooPromise) {
    res.redirect("/filter");
  } else {
    res.render("index", {authUrl: authUrl});
  }
});

app.get("/auth", function(req, res) {
  if (!snooPromise) {
    const auth = new URL(req.url, "http://localhost:8080/");
    const code = auth.searchParams.get("code");
    // if !code, then "something went wrong"
    snooPromise = snoowrap.fromAuthCode({
      code: code,
      userAgent: "web:subredditfilter:v1.0.0 (by /u/jvnie)",
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: "http://localhost:8080/auth"
    });
  }
  res.redirect("/filter");
});

app.get("/filter", function(req, res) {
  if (!snooPromise) return res.redirect("/");
  res.render("filter", {content: content});
});

app.post("/filter", function(req, res) {
  if (!snooPromise) return res.redirect("/");
  const subreddit = req.body.rInput.trim().toLowerCase();
  const contentType = req.body.contentType;
  reddit.search(snooPromise, subreddit, contentType).then(list => {
    content = ``;
    list.forEach(post => {
      let image;
      if (post.thumbnail.substring(0,4) === "http")
        image = post.thumbnail;
      else if (post.thumbnail === "image")
        image = post.url;
      else
        image = "https://s3.amazonaws.com/media.eremedia.com/uploads/2014/10/15174120/reddit-logo2.png";

      content += `
        <div class="ui segment">
          <div class="ui items">
            <div class="item">
              <div class="ui small image">
                <img class="ui small image" src="${image}">
              </div>
              <div class="content">
                <h4 class="ui header">${post.title}</h4>
                <div class="description">
                  <p>${post.selftext.substring(0,300)}...</p>
                </div>
                <div class="extra">
                  <a href="https://www.reddit.com/${post.permalink}" target="_blank" class="ui primary button">
                    Read More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    return res.render("filter", {content: content});
  });
});

app.listen(8080, "localhost", function() {
  console.log("Server started...")
});