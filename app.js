const { App } = require("@slack/bolt");
const axios = require("axios");

require("dotenv").config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
  port: process.env.PORT || 3000,
});

app.message("matches", async ({ message, say }) => {
  if (message.text === "matches" || message.text === "*matches*") {
    await say(
      `Commands:\n*[today]*: Retrieve today's matches.\n*[tomorrow]*: Retrieve tomorrow's matches.\n*[this week]*: Retrieve this week's matches until monday.\n*[next week]*: Retrieve next week's matches next monday.`
    );
  }
});

app.message("today", async ({ message, say }) => {
  if (message.text === "today" || message.text === "*today*") {
    axios
      .get("https://api.football-data-api.com/todays-matches", {
        params: {
          key: "ae0234dbf0cc8ad535a97b2bfcbb1fc4d1c9339b79f8567c0d872aa687e06a81",
        },
      })
      .then(async function (response) {
        const replyArr = [];
        // console.log(response.data.data)
        if (response.data.data.length > 0) {
          response.data.data.forEach(async (match) => {
            replyArr.push(
              `${convertToDateString(match.date_unix)}${match.home_name} vs ${
                match.away_name
              }\n`
            );
          });
          await say(replyArr.join(""));
        } else {
          await say("There is no matches on this day.");
        }
      });
  }
});

app.message("tomorrow", async ({ message, say }) => {
  if (message.text === "tomorrow" || message.text === "*tomorrow*") {
    var d = new Date();
    var date = Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() + 1,
      0,
      0,
      0
    );
    let tomorrowDate = new Date(date).toISOString().split("T")[0];

    axios
      .get("https://api.football-data-api.com/todays-matches", {
        params: {
          date: tomorrowDate,
          key: "ae0234dbf0cc8ad535a97b2bfcbb1fc4d1c9339b79f8567c0d872aa687e06a81",
        },
      })
      .then(async function (response) {
        const replyArr = [];
        if (response.data.data.length > 0) {
          response.data.data.forEach(async (match) => {
            replyArr.push(
              `${convertToDateString(match.date_unix)}${match.home_name} vs ${
                match.away_name
              }\n`
            );
          });

          await say(replyArr.join(""));
        } else {
          await say("There is no matches on this day.");
        }
      });
  }
});

app.message("this week", async ({ message, say }) => {
  if (message.text === "this week" || message.text === "*this week*") {
    var d = new Date();
    var today = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
    );
    let todayString = today.toISOString().split("T")[0];

    var m = new Date();
    m = new Date(
      Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate(), 0, 0, 0)
    );
    m.setDate(m.getDate() + ((1 + 7 - m.getDay()) % 7 || 7));

    const dates = getDatesInRange(today, m);
    // console.log(dates);

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          // console.log(responses[0].data.data);
          responses.forEach((x) => {
            if (x.data.data.length > 0) {
              x.data.data.forEach((match) => {
                replyArr.push(
                  `${convertToDateString(match.date_unix)}${
                    match.home_name
                  } vs ${match.away_name}\n`
                );
              });
            }
          });

          if (replyArr.length > 0) {
            await say(replyArr.join(""));
          } else {
            await say("There is no matches on this day.");
          }
        })
      )
      .catch(async (errors) => {
        await say("Something went wrong with the football api.");
      });
  }
});

app.message("next week", async ({ message, say }) => {
  if (message.text === "next week" || message.text === "*next week*") {
    var d = new Date();
    var today = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
    );
    let todayString = today.toISOString().split("T")[0];

    var m = new Date();
    m = new Date(
      Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate(), 0, 0, 0)
    );
    m.setDate(m.getDate() + ((1 + 7 - m.getDay()) % 7 || 7));
    m.setDate(m.getDate() + 1 * 7);

    const dates = getDatesInRange(today, m);
    // console.log(dates);

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          // console.log(responses[0].data.data);
          responses.forEach((x) => {
            if (x.data.data.length > 0) {
              x.data.data.forEach((match) => {
                replyArr.push(
                  `${convertToDateString(match.date_unix)}${
                    match.home_name
                  } vs ${match.away_name}\n`
                );
              });
            }
          });

          if (replyArr.length > 0) {
            await say(replyArr.join(""));
          } else {
            await say("There is no matches on this day.");
          }
        })
      )
      .catch(async (errors) => {
        await say("Something went wrong with the football api.");
      });
  }
});

(async () => {
  //   const port = 3000;
  //   await app.start(process.env.PORT || port);
  await app.start();
})();

function convertToDateString(unixDate) {
  let date = new Date(unixDate * 1000);
  date.setTime(date.getTime() + 3 * 60 * 60 * 1000);

  let formattedDate =
    ("0" + date.getUTCDate()).slice(-2) +
    "/" +
    ("0" + (date.getUTCMonth() + 1)).slice(-2) +
    "/" +
    date.getUTCFullYear() +
    ", " +
    ("0" + date.getUTCHours()).slice(-2) +
    ":" +
    ("0" + date.getUTCMinutes()).slice(-2) +
    ":" +
    ("0" + date.getUTCSeconds()).slice(-2);

  return `*[${formattedDate}]* `;
}

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());

  const dates = [];

  while (date < endDate) {
    let dateToPush = new Date(date).toISOString().split("T")[0];
    dates.push(
      axios.get(
        `https://api.football-data-api.com/todays-matches?key=ae0234dbf0cc8ad535a97b2bfcbb1fc4d1c9339b79f8567c0d872aa687e06a81&date=${dateToPush}`
      )
    );
    date.setDate(date.getDate() + 1);
  }

  return dates;
}
