const { App } = require("@slack/bolt");
const axios = require("axios");

require("dotenv").config();

let allLeagues = {
  germany: [
    { name: "Bundesliga 1", id: 78 },
    { name: "Bundesliga 2", id: 79 },
    { name: "Super Cup", id: 529 },
  ],
  england: [
    { name: "Premier League", id: 39 },
    { name: "Championship", id: 40 },
    { name: "Community Shield", id: 528 },
    { name: "FA Cup", id: 45 },
  ],
  france: [
    { name: "Ligue 1", id: 61 },
    { name: "Coupe de la Ligue", id: 65 },
    { name: "Coupe de France", id: 66 },
    { name: "Trophée des Champions", id: 526 },
  ],
  netherlands: [
    { name: "Eredivisie", id: 88 },
    { name: "KNVB Beker", id: 90 },
  ],
  italy: [
    { name: "Serie A", id: 135 },
    { name: "Coppa Italia", id: 137 },
  ],
  turkey: [
    { name: "Super Lig", id: 203 },
    { name: "TFF 1. Lig", id: 204 },
    { name: "Turkish Cup (Ziraat Türkiye Kupası)", id: 206 },
    { name: "Super Cup", id: 551 },
  ],
  spain: [
    { name: "La Liga", id: 140 },
    { name: "Copa del Rey", id: 143 },
    { name: "Super Cup", id: 556 },
  ],
  international: [
    { name: "World Cup", id: 1 },
    { name: "Euro Championship", id: 4 },

    { name: "World Cup - Qualification Africa", id: 29 },
    { name: "World Cup - Qualification CONCACAF", id: 31 },
    { name: "World Cup - Qualification Europe", id: 32 },
    { name: "World Cup - Qualification Oceania", id: 33 },
    { name: "World Cup - Qualification South America", id: 34 },
    { name: "World Cup - Qualification Intercontinental Play-offs", id: 37 },
    { name: "Africa Cup of Nations", id: 6 },
    { name: "Africa Cup of Nations - Qualification", id: 36 },
  ],
  europe: [
    { name: "UEFA Champions League", id: 2 },
    { name: "UEFA Europa League", id: 3 },
    { name: "UEFA Europa Conference League", id: 848 },
    { name: "UEFA Super Cup", id: 531 },
    { name: "UEFA Nations League", id: 5 },
  ],

  argentina: [{ name: "Primera Division", id: 128 }],

  brazil: [{ name: "Serie A", id: 71 }],
  america: [{ name: "CONMEBOL Libertadores", id: 13 }],
};

const API_KEY = "d2e3805c4bb5e53b11ac78f290450b9b";
const currentSeason = 2022;
const utcTime = 3;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
  port: process.env.PORT || 3000,
});

app.message(/commands/i, async ({ message, say }) => {
  message.text = pipeMessage(message);

  if (message.text === "commands") {
    await say(
      `\`Commands\`\n*[leagues]*: Retrieve leagues's.\n*[today]*: Retrieve today's matches.\n*[tomorrow]*: Retrieve tomorrow's matches.\n*[this week]*: Retrieve this week's matches until monday.\n*[next week]*: Retrieve next week's matches until next monday.\n*[next 2 weeks]*: Basically *[this week] + [next week]*.`
    );
  }
});

app.message(/leagues/i, async ({ message, say }) => {
  message.text = pipeMessage(message);

  if (message.text === "leagues") {
    const replyArr = [];
    // await getLeagues();
    replyArr.push(`\`Leagues\`\n`);
    for (const country in allLeagues) {
      replyArr.push(
        `*[${capitalizeFirstLetter(country)}]* ${returnLeagueNames(
          allLeagues[country]
        )}\n`
      );
    }
    replyArr.push(
      `_-You can combine a league with other commands, ex: *spain tomorrow*_`
    );
    await say(replyArr.join(""));
  }
});

app.message(/today/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");

  if (message.text === "today") {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    let dates = [];
    const replyArr = [];

    for (let country in allLeagues) {
      dates = [];

      allLeagues[country].forEach((x) => {
        dates.push(
          axios.get(`https://v3.football.api-sports.io/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: currentSeason,
              league: x.id,
              date: strToday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (!replyArr.includes(`\`${response[0].league.country}\`\n`)) {
                  replyArr.push(`\`${response[0].league.country}\`\n`);
                }
                replyArr.push(`\• *${response[0].league.name}*\n`);
                response.forEach((game) => {
                  if (!replyArr.includes(`\`${game.league.country}\`\n`)) {
                    replyArr.push(`\`${game.league.country}\`\n`);
                  }
                  replyArr.push(
                    `${convertToDateString(game.fixture.timestamp)}${
                      game.teams.home.name
                    } vs ${game.teams.away.name}${
                      game.goals.home || game.goals.home === 0
                        ? ` (${game.goals.home}-${game.goals.away})`
                        : ""
                    }\n`
                  );
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 2 &&
    allLeagues[arr[0]] &&
    arr[1].toLowerCase() === "today"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const dates = [];

    allLeagues[arr[0]].forEach((x) => {
      dates.push(
        axios.get(`https://v3.football.api-sports.io/fixtures`, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: currentSeason,
            league: x.id,
            date: strToday,
            timezone: "Europe/Istanbul",
          },
        })
      );
    });

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              replyArr.push(`\`${response[0].league.name}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(game.fixture.timestamp)}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    game.goals.home || game.goals.home === 0
                      ? ` (${game.goals.home}-${game.goals.away})`
                      : ""
                  }\n`
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

app.message(/tomorrow/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");

  if (message.text === "tomorrow") {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);

    today.setUTCDate(today.getUTCDate() + 1);

    const strToday = returnUTCString(today);
    let dates = [];
    const replyArr = [];

    for (let country in allLeagues) {
      dates = [];

      allLeagues[country].forEach((x) => {
        dates.push(
          axios.get(`https://v3.football.api-sports.io/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: currentSeason,
              league: x.id,
              date: strToday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (!replyArr.includes(`\`${response[0].league.country}\`\n`)) {
                  replyArr.push(`\`${response[0].league.country}\`\n`);
                }
                replyArr.push(`\• *${response[0].league.name}*\n`);
                response.forEach((game) => {
                  if (!replyArr.includes(`\`${game.league.country}\`\n`)) {
                    replyArr.push(`\`${game.league.country}\`\n`);
                  }
                  replyArr.push(
                    `${convertToDateString(game.fixture.timestamp)}${
                      game.teams.home.name
                    } vs ${game.teams.away.name}${
                      game.goals.home || game.goals.home === 0
                        ? ` (${game.goals.home}-${game.goals.away})`
                        : ""
                    }\n`
                  );
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 2 &&
    allLeagues[arr[0]] &&
    arr[1].toLowerCase() === "tomorrow"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);

    today.setUTCDate(today.getUTCDate() + 1);

    const strToday = returnUTCString(today);
    const dates = [];

    allLeagues[arr[0]].forEach((x) => {
      dates.push(
        axios.get(`https://v3.football.api-sports.io/fixtures`, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: currentSeason,
            league: x.id,
            date: strToday,
            timezone: "Europe/Istanbul",
          },
        })
      );
    });

    Promise.all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              replyArr.push(`\`${response[0].league.name}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(game.fixture.timestamp)}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    game.goals.home || game.goals.home === 0
                      ? ` (${game.goals.home}-${game.goals.away})`
                      : ""
                  }\n`
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

    // Add turkey utc
    // unixTime += 180 * 60;
  }
});

app.message(/this week/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");

  if (message.text === "this week") {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const strSunday = returnUTCString(getNextDateByIndex(today.getUTCDay()));

    let dates = [];
    const replyArr = [];

    // console.log(strToday + "-------" + strSunday);

    for (let country in allLeagues) {
      dates = [];

      allLeagues[country].forEach((x) => {
        dates.push(
          axios.get(`https://v3.football.api-sports.io/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: currentSeason,
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (!replyArr.includes(`\`${response[0].league.country}\`\n`)) {
                  replyArr.push(`\`${response[0].league.country}\`\n`);
                }
                replyArr.push(`\• *${response[0].league.name}*\n`);
                response.forEach((game) => {
                  if (!replyArr.includes(`\`${game.league.country}\`\n`)) {
                    replyArr.push(`\`${game.league.country}\`\n`);
                  }
                  replyArr.push(
                    `${convertToDateString(game.fixture.timestamp)}${
                      game.teams.home.name
                    } vs ${game.teams.away.name}${
                      game.goals.home || game.goals.home === 0
                        ? ` (${game.goals.home}-${game.goals.away})`
                        : ""
                    }\n`
                  );
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 3 &&
    allLeagues[arr[0]] &&
    arr[1].toLowerCase() === "this" &&
    arr[2].toLowerCase() === "week"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const strSunday = returnUTCString(getNextDateByIndex(today.getUTCDay()));
    const dates = [];
    // console.log(strToday + "-------" + strSunday);

    allLeagues[arr[0]].forEach((x) => {
      dates.push(
        axios.get(`https://v3.football.api-sports.io/fixtures`, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: currentSeason,
            league: x.id,
            from: strToday,
            to: strSunday,
            timezone: "Europe/Istanbul",
          },
        })
      );
    });

    Promise.all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              replyArr.push(`\`${response[0].league.name}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(game.fixture.timestamp)}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    game.goals.home || game.goals.home === 0
                      ? ` (${game.goals.home}-${game.goals.away})`
                      : ""
                  }\n`
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

app.message(/next week/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");
  if (message.text === "next week") {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    let dates = [];
    const replyArr = [];

    // console.log(strToday + "-------" + strSunday);

    for (let country in allLeagues) {
      dates = [];

      allLeagues[country].forEach((x) => {
        dates.push(
          axios.get(`https://v3.football.api-sports.io/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: currentSeason,
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (!replyArr.includes(`\`${response[0].league.country}\`\n`)) {
                  replyArr.push(`\`${response[0].league.country}\`\n`);
                }
                replyArr.push(`\• *${response[0].league.name}*\n`);
                response.forEach((game) => {
                  if (!replyArr.includes(`\`${game.league.country}\`\n`)) {
                    replyArr.push(`\`${game.league.country}\`\n`);
                  }
                  replyArr.push(
                    `${convertToDateString(game.fixture.timestamp)}${
                      game.teams.home.name
                    } vs ${game.teams.away.name}${
                      game.goals.home || game.goals.home === 0
                        ? ` (${game.goals.home}-${game.goals.away})`
                        : ""
                    }\n`
                  );
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 3 &&
    allLeagues[arr[0]] &&
    arr[1].toLowerCase() === "next" &&
    arr[2].toLowerCase() === "week"
  ) {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    // console.log(strToday + "-------" + strSunday);
    const dates = [];

    allLeagues[arr[0]].forEach((x) => {
      dates.push(
        axios.get(`https://v3.football.api-sports.io/fixtures`, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: currentSeason,
            league: x.id,
            from: strToday,
            to: strSunday,
            timezone: "Europe/Istanbul",
          },
        })
      );
    });

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              replyArr.push(`\`${response[0].league.name}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(game.fixture.timestamp)}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    game.goals.home || game.goals.home === 0
                      ? ` (${game.goals.home}-${game.goals.away})`
                      : ""
                  }\n`
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

app.message(/next 2 weeks|next 2 week/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");
  // console.log(message.text);
  if (message.text === "next 2 week" || message.text === "next 2 weeks") {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    // today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    let dates = [];
    const replyArr = [];

    // console.log(strToday + "-------" + strSunday);

    for (let country in allLeagues) {
      dates = [];

      allLeagues[country].forEach((x) => {
        dates.push(
          axios.get(`https://v3.football.api-sports.io/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: currentSeason,
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (!replyArr.includes(`\`${response[0].league.country}\`\n`)) {
                  replyArr.push(`\`${response[0].league.country}\`\n`);
                }
                replyArr.push(`\• *${response[0].league.name}*\n`);
                response.forEach((game) => {
                  if (!replyArr.includes(`\`${game.league.country}\`\n`)) {
                    replyArr.push(`\`${game.league.country}\`\n`);
                  }
                  replyArr.push(
                    `${convertToDateString(game.fixture.timestamp)}${
                      game.teams.home.name
                    } vs ${game.teams.away.name}${
                      game.goals.home || game.goals.home === 0
                        ? ` (${game.goals.home}-${game.goals.away})`
                        : ""
                    }\n`
                  );
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 4 &&
    allLeagues[arr[0]] &&
    arr[1].toLowerCase() === "next" &&
    arr[2].toLowerCase() === "2" &&
    (arr[3].toLowerCase() === "week" || arr[3].toLowerCase() === "weeks")
  ) {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    // today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    // console.log(strToday + "-------" + strSunday);
    const dates = [];

    allLeagues[arr[0]].forEach((x) => {
      dates.push(
        axios.get(`https://v3.football.api-sports.io/fixtures`, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: currentSeason,
            league: x.id,
            from: strToday,
            to: strSunday,
            timezone: "Europe/Istanbul",
          },
        })
      );
    });

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              replyArr.push(`\`${response[0].league.name}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(game.fixture.timestamp)}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    game.goals.home || game.goals.home === 0
                      ? ` (${game.goals.home}-${game.goals.away})`
                      : ""
                  }\n`
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function pipeMessage(message) {
  message.text = message.text.toLowerCase();
  message.text = message.text.replace(/  +/g, " ");
  message.text = message.text.replace(/[\*_`]/g, "");
  return message.text;
}

function returnLeagueNames(country) {
  let string = "(";
  country.forEach((x) => {
    string += " " + x.name + ",";
  });
  string = string.slice(0, -1);
  string += " )";
  return string;
}

function convertToDateString(unixDate) {
  let date = new Date(unixDate * 1000);
  // Add UTC
  date.setTime(date.getTime() + utcTime * 60 * 60 * 1000);

  let formattedDate =
    ("0" + date.getUTCDate()).slice(-2) +
    "/" +
    ("0" + (date.getUTCMonth() + 1)).slice(-2) +
    "/" +
    date.getUTCFullYear() +
    "] " +
    ("0" + date.getUTCHours()).slice(-2) +
    ":" +
    ("0" + date.getUTCMinutes()).slice(-2);
  // ":" +
  // ("0" + date.getUTCSeconds()).slice(-2);

  return `*[${formattedDate}* `;
}

function getNextDateByIndex(todayIndex, desiredDayIndex = 0) {
  let today = new Date();
  today.setUTCHours(new Date().getUTCHours() + utcTime);
  if (todayIndex === 0) {
    return today;
  }

  today.setUTCDate(
    today.getUTCDate() + ((desiredDayIndex - 1 - today.getUTCDay() + 7) % 7) + 1
  );
  return today;
}

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function returnUTCString(date) {
  return [
    date.getFullYear(),
    padTo2Digits(date.getUTCMonth() + 1),
    padTo2Digits(date.getUTCDate()),
  ].join("-");
}

function sortByDate(a, b) {
  if (a.fixture.timestamp < b.fixture.timestamp) {
    return -1;
  }
  if (a.fixture.timestamp > b.fixture.timestamp) {
    return 1;
  }
  return 0;
}
