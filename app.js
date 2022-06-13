const { App } = require("@slack/bolt");
const axios = require("axios");

require("dotenv").config();

let footballLeagues = {
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
  world: [
    { name: "World Cup", id: 1 },
    { name: "Euro Championship", id: 4 },
    { name: "UEFA Nations League", id: 5 },

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
  ],

  argentina: [{ name: "Primera Division", id: 128 }],

  brazil: [{ name: "Serie A", id: 71 }],
  usa: [{ name: "CONMEBOL Libertadores", id: 13 }],
};

let basketLeagues = {
  usa: [{ name: "NBA", id: 12 }],
  turkey: [
    { name: "TBL", id: 102 },
    { name: "Turkish Cup", id: 166 },
  ],
  europe: [{ name: "Euroleague", id: 120 }, { name: "Eurocup", id: 194 }, ,],
};

let volleyLeagues = {
  turkey: [
    { name: "Efeler Ligi", id: 172 },
    { name: "Sultanlar Ligi Women", id: 174 },
    { name: "Super Cup (Mens)", id: 168 },
    { name: "Turkish Cup (Mens)", id: 170 },
    { name: "Super Cup (Women)", id: 169 },
    { name: "Turkish Cup (Women)", id: 171 },
  ],
  world: [
    { name: "Nations League Men", id: 183 },
    { name: "Nations League Women", id: 184 },
    { name: "World Championship Men", id: 185 },
    { name: "World Championship Women", id: 186 },
    { name: "World Cup Women", id: 188 },
  ],
};

let f1Leagues = {
  world: [{ name: "Australia Grand Prix", id: 1 }],
};

const sports = {
  football: {
    request: "https://v3.football.api-sports.io/fixtures",
    leagueArr: footballLeagues,
  },
  basketball: {
    request: "https://v1.basketball.api-sports.io/games",
    leagueArr: basketLeagues,
  },
  volleyball: {
    request: "https://v1.volleyball.api-sports.io/games",
    leagueArr: volleyLeagues,
  },
  f1: {
    request: "https://v1.formula-1.api-sports.io/races",
    leagueArr: f1Leagues,
  },
};

function returnTimestamp(sport, property) {
  if (sport === "football") {
    return property.fixture.timestamp;
  } else if (
    sport === "basketball" ||
    sport === "volleyball" ||
    sport === "f1"
  ) {
    return property.timestamp;
  }
}

function returnCountry(sport, property) {
  if (sport === "football") {
    return property.league.country;
  } else if (sport === "basketball" || sport === "volleyball") {
    return property.country.name;
  } else if (sport === "f1") {
    return property.competition.location.country;
  }
}

function returnHomeScore(sport, property) {
  if (sport === "football") {
    return property?.goals?.home;
  } else if (sport === "basketball") {
    return property?.scores?.home?.total;
  } else if (sport === "volleyball") {
    return property?.scores?.home;
  }
}

function returnAwayScore(sport, property) {
  if (sport === "football") {
    return property.goals?.away;
  } else if (sport === "basketball") {
    return property.scores?.away?.total;
  } else if (sport === "volleyball") {
    return property.scores?.away;
  }
}

function returnLeagueName(sport, property) {
  if (
    sport === "football" ||
    sport === "basketball" ||
    sport === "volleyball"
  ) {
    return property.league.name;
  } else if (sport === "f1") {
    return property.competition.name;
  }
}

function returnSeason(sport) {
  if (sport === "basketball") {
    return basketSeason;
  } else {
    return currentSeason;
  }
}

const API_KEY = "d2e3805c4bb5e53b11ac78f290450b9b";
// These variables should change every season
const currentSeason = 2022;
const basketSeason = "2021-2022";
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
      `\`Commands\`\n*[sports]*: Retrieve available sport's.\n*[leagues]*: Retrieve leagues's.\n*[today]*: Retrieve today's matches.\n*[tomorrow]*: Retrieve tomorrow's matches.\n*[this week]*: Retrieve this week's matches until monday.\n*[next week]*: Retrieve next week's matches until next monday.\n*[next 2 weeks]*: Basically *[this week] + [next week]*.\n _-Don't forget to add name of the sport to the end of the command, ex: *today football*_`
    );
  }
});

app.message(/sports/i, async ({ message, say }) => {
  message.text = pipeMessage(message);

  if (message.text === "sports") {
    await say(
      `\`Sports\`\n*football*, *basketball*, *volleyball*, *f1*`
    );
  }
});

app.message(/leagues/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");

  if (arr[0].toLowerCase() === "leagues" && sports[arr[1]?.toLowerCase()]) {
    const replyArr = [];

    const sport = arr[1]?.toLowerCase();
    // await getLeagues();
    if (sport === "f1") {
      await say("Formula 1 leagues are all Grand Prix available");
    } else {
      replyArr.push(`\`Leagues\`\n`);
      for (const country in sports[sport].leagueArr) {
        replyArr.push(
          `*[${capitalizeFirstLetter(country)}]* ${returnLeagueNames(
            sports[sport].leagueArr[country]
          )}\n`
        );
      }
      replyArr.push(
        `_-You can combine a league with other commands, ex: *turkey tomorrow ${sport}*_`
      );
      await say(replyArr.join(""));
    }
  }
});

app.message(/today/i, async ({ message, say }) => {
  message.text = pipeMessage(message);
  let arr = message.text.split(" ");

  if (arr[0].toLowerCase() === "today" && sports[arr[1]?.toLowerCase()]) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    let dates = [];
    const replyArr = [];
    const sport = arr[1]?.toLowerCase();

    for (let country in sports[sport].leagueArr) {
      dates = [];

      if (sport === "f1") {
        dates.push(
          axios.get(sports[sport].request, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: returnSeason(sport),
              date: strToday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      } else {
        sports[sport].leagueArr[country].forEach((x) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                date: strToday,
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      }

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              // if (sport === "f1") {
              //   response.forEach((game) => {
              //     game.timestamp = returnDateF1(game.date)
              //   });
              // }
              response.sort(sortByDate);
              if (response.length > 0) {
                if (
                  !replyArr.includes(
                    `\n\`${returnCountry(sport, response[0])}\`\n`
                  )
                ) {
                  replyArr.push(`\n\`${returnCountry(sport, response[0])}\`\n`);
                }
                replyArr.push(`\• *${returnLeagueName(sport, response[0])}*\n`);
                response.forEach((game) => {
                  if (
                    !replyArr.includes(`\n\`${returnCountry(sport, game)}\`\n`)
                  ) {
                    replyArr.push(`\n\`${returnCountry(sport, game)}\`\n`);
                  }
                  if (sport === "f1") {
                    // game.timestamp = new Date(game.date).getTime();
                    replyArr.push(
                      `${returnDateF1(game.date)}${game.circuit.name}\n`
                    );
                  } else {
                    replyArr.push(
                      `${convertToDateString(returnTimestamp(sport, game))}${
                        game.teams.home.name
                      } vs ${game.teams.away.name}${
                        returnHomeScore(sport, game) ||
                        returnHomeScore(sport, game) === 0
                          ? ` (${returnHomeScore(
                              sport,
                              game
                            )}-${returnAwayScore(sport, game)})`
                          : ""
                      }\n`
                    );
                  }
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
    arr[2]?.toLowerCase() !== "f1" &&
    sports[arr[2]?.toLowerCase()]?.leagueArr[arr[0]?.toLowerCase()] &&
    arr[1].toLowerCase() === "today"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const dates = [];

    const sport = arr[2]?.toLowerCase();

    sports[arr[2]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
      dates.push(
        axios.get(sports[sport].request, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: returnSeason(sport),
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
              replyArr.push(`\`${returnLeagueName(sport, response[0])}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(returnTimestamp(sport, game))}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    returnHomeScore(sport, game) ||
                    returnHomeScore(sport, game) === 0
                      ? ` (${returnHomeScore(sport, game)}-${returnAwayScore(
                          sport,
                          game
                        )})`
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

  if (arr[0].toLowerCase() === "tomorrow" && sports[arr[1]?.toLowerCase()]) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);

    today.setUTCDate(today.getUTCDate() + 1);

    const strToday = returnUTCString(today);
    let dates = [];
    const replyArr = [];

    const sport = arr[1]?.toLowerCase();

    for (let country in sports[sport].leagueArr) {
      dates = [];

      if (sport === "f1") {
        dates.push(
          axios.get(sports[sport].request, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: returnSeason(sport),
              date: strToday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      } else {
        sports[sport].leagueArr[country].forEach((x) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                date: strToday,
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      }

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (
                  !replyArr.includes(
                    `\n\`${returnCountry(sport, response[0])}\`\n`
                  )
                ) {
                  replyArr.push(`\n\`${returnCountry(sport, response[0])}\`\n`);
                }
                replyArr.push(`\• *${returnLeagueName(sport, response[0])}*\n`);
                response.forEach((game) => {
                  if (
                    !replyArr.includes(`\n\`${returnCountry(sport, game)}\`\n`)
                  ) {
                    replyArr.push(`\n\`${returnCountry(sport, game)}\`\n`);
                  }

                  if (sport === "f1") {
                    // game.timestamp = new Date(game.date).getTime();
                    replyArr.push(
                      `${returnDateF1(game.date)}${game.circuit.name}\n`
                    );
                  } else {
                    replyArr.push(
                      `${convertToDateString(returnTimestamp(sport, game))}${
                        game.teams.home.name
                      } vs ${game.teams.away.name}${
                        returnHomeScore(sport, game) ||
                        returnHomeScore(sport, game) === 0
                          ? ` (${returnHomeScore(
                              sport,
                              game
                            )}-${returnAwayScore(sport, game)})`
                          : ""
                      }\n`
                    );
                  }
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
    arr[2]?.toLowerCase() !== "f1" &&
    sports[arr[2]?.toLowerCase()]?.leagueArr[arr[0]?.toLowerCase()] &&
    arr[1].toLowerCase() === "tomorrow"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);

    today.setUTCDate(today.getUTCDate() + 1);

    const strToday = returnUTCString(today);
    const dates = [];

    const sport = arr[2]?.toLowerCase();

    sports[arr[2]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
      dates.push(
        axios.get(sports[sport].request, {
          headers: { "x-apisports-key": API_KEY },
          params: {
            season: returnSeason(sport),
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
              replyArr.push(`\`${returnLeagueName(sport, response[0])}\`\n`);
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(returnTimestamp(sport, game))}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    returnHomeScore(sport, game) ||
                    returnHomeScore(sport, game) === 0
                      ? ` (${returnHomeScore(sport, game)}-${returnAwayScore(
                          sport,
                          game
                        )})`
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

  if (
    arr[0]?.toLowerCase() === "this" &&
    arr[1]?.toLowerCase() === "week" &&
    sports[arr[2]?.toLowerCase()]
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const strSunday = returnUTCString(getNextDateByIndex(today.getUTCDay()));

    let dates = [];
    const replyArr = [];

    const sport = arr[2]?.toLowerCase();

    // console.log(strToday + "-------" + strSunday);

    for (let country in sports[sport].leagueArr) {
      dates = [];
      // console.log(today);
      // console.log(getNextDateByIndex(today.getUTCDay()));
      // console.log(
      //   getDatesInRange(today, getNextDateByIndex(today.getUTCDay()))
      // );

      if (sport === "football") {
        sports[sport].leagueArr[country].forEach((x) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                from: strToday,
                to: strSunday,
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      } else if (sport === "f1") {
        const eachDay = getDatesInRange(
          today,
          getNextDateByIndex(today.getUTCDay())
        );
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  // competition: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      } else {
        const eachDay = getDatesInRange(
          today,
          getNextDateByIndex(today.getUTCDay())
        );
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  league: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      }

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (
                  !replyArr.includes(
                    `\n\`${returnCountry(sport, response[0])}\`\n`
                  )
                ) {
                  replyArr.push(`\n\`${returnCountry(sport, response[0])}\`\n`);
                }

                if (
                  !replyArr.includes(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  )
                ) {
                  replyArr.push(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  );
                }
                response.forEach((game) => {
                  if (
                    !replyArr.includes(`\n\`${returnCountry(sport, game)}\`\n`)
                  ) {
                    replyArr.push(`\n\`${returnCountry(sport, game)}\`\n`);
                  }

                  if (sport === "f1") {
                    // game.timestamp = new Date(game.date).getTime();
                    replyArr.push(
                      `${returnDateF1(game.date)}${game.circuit.name}\n`
                    );
                  } else {
                    replyArr.push(
                      `${convertToDateString(returnTimestamp(sport, game))}${
                        game.teams.home.name
                      } vs ${game.teams.away.name}${
                        returnHomeScore(sport, game) ||
                        returnHomeScore(sport, game) === 0
                          ? ` (${returnHomeScore(
                              sport,
                              game
                            )}-${returnAwayScore(sport, game)})`
                          : ""
                      }\n`
                    );
                  }
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
    arr[3]?.toLowerCase() !== "f1" &&
    sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]?.toLowerCase()] &&
    arr[1].toLowerCase() === "this" &&
    arr[2].toLowerCase() === "week"
  ) {
    const today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    const strToday = returnUTCString(today);
    const strSunday = returnUTCString(getNextDateByIndex(today.getUTCDay()));
    const dates = [];
    // console.log(strToday + "-------" + strSunday);

    const sport = arr[3]?.toLowerCase();

    if (sport === "football") {
      sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
        dates.push(
          axios.get(sports[sport].request, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: returnSeason(sport),
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });
    } else {
      const eachDay = getDatesInRange(
        today,
        getNextDateByIndex(today.getUTCDay())
      );

      sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
        eachDay.forEach((day) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                date: returnUTCString(day),
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      });
    }

    Promise.all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              if (
                !replyArr.includes(
                  `\`${returnLeagueName(sport, response[0])}\`\n`
                )
              ) {
                replyArr.push(`\`${returnLeagueName(sport, response[0])}\`\n`);
              }
              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(returnTimestamp(sport, game))}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    returnHomeScore(sport, game) ||
                    returnHomeScore(sport, game) === 0
                      ? ` (${returnHomeScore(sport, game)}-${returnAwayScore(
                          sport,
                          game
                        )})`
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

  if (
    arr[0]?.toLowerCase() === "next" &&
    arr[1]?.toLowerCase() === "week" &&
    sports[arr[2]?.toLowerCase()]
  ) {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    let dates = [];
    const replyArr = [];

    const sport = arr[2]?.toLowerCase();

    // const
    // console.log(strToday + "-------" + strSunday);

    for (let country in sports[sport].leagueArr) {
      dates = [];

      if (sport === "football") {
        sports[sport].leagueArr[country].forEach((x) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                from: strToday,
                to: strSunday,
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      } else if (sport === "f1") {
        const eachDay = getDatesInRange(today, sunday);
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  // competition: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      } else {
        const eachDay = getDatesInRange(today, sunday);
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  league: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      }

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (
                  !replyArr.includes(
                    `\n\`${returnCountry(sport, response[0])}\`\n`
                  )
                ) {
                  replyArr.push(`\n\`${returnCountry(sport, response[0])}\`\n`);
                }

                if (
                  !replyArr.includes(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  )
                ) {
                  replyArr.push(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  );
                }

                response.forEach((game) => {
                  if (
                    !replyArr.includes(`\n\`${returnCountry(sport, game)}\`\n`)
                  ) {
                    replyArr.push(`\n\`${returnCountry(sport, game)}\`\n`);
                  }

                  if (sport === "f1") {
                    // game.timestamp = new Date(game.date).getTime();
                    replyArr.push(
                      `${returnDateF1(game.date)}${game.circuit.name}\n`
                    );
                  } else {
                    replyArr.push(
                      `${convertToDateString(returnTimestamp(sport, game))}${
                        game.teams.home.name
                      } vs ${game.teams.away.name}${
                        returnHomeScore(sport, game) ||
                        returnHomeScore(sport, game) === 0
                          ? ` (${returnHomeScore(
                              sport,
                              game
                            )}-${returnAwayScore(sport, game)})`
                          : ""
                      }\n`
                    );
                  }
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
    arr[3]?.toLowerCase() !== "f1" &&
    sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]?.toLowerCase()] &&
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

    const sport = arr[3]?.toLowerCase();

    if (sport === "football") {
      sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
        dates.push(
          axios.get(sports[sport].request, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: returnSeason(sport),
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });
    } else {
      const eachDay = getDatesInRange(
        today,
        getNextDateByIndex(today.getUTCDay())
      );

      sports[arr[3]?.toLowerCase()]?.leagueArr[arr[0]].forEach((x) => {
        eachDay.forEach((day) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                date: returnUTCString(day),
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      });
    }

    Promise.all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              if (
                !replyArr.includes(
                  `\`${returnLeagueName(sport, response[0])}\`\n`
                )
              ) {
                replyArr.push(`\`${returnLeagueName(sport, response[0])}\`\n`);
              }

              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(returnTimestamp(sport, game))}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    returnHomeScore(sport, game) ||
                    returnHomeScore(sport, game) === 0
                      ? ` (${returnHomeScore(sport, game)}-${returnAwayScore(
                          sport,
                          game
                        )})`
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
  if (
    arr[0]?.toLowerCase() === "next" &&
    arr[1]?.toLowerCase() === "2" &&
    (arr[2]?.toLowerCase() === "week" || arr[2]?.toLowerCase() === "weeks") &&
    sports[arr[3]?.toLowerCase()]
  ) {
    let today = new Date();
    today.setUTCHours(new Date().getUTCHours() + utcTime);
    // today = getNextDateByIndex(today.getUTCDay(), 1);
    const strToday = returnUTCString(today);

    let sunday = getNextDateByIndex(today.getUTCDay());
    sunday.setUTCDate(sunday.getUTCDate() + 1 * 7);
    const strSunday = returnUTCString(sunday);

    let dates = [];
    const replyArr = [];

    const sport = arr[3]?.toLowerCase();

    // console.log(strToday + "-------" + strSunday);

    for (let country in sports[sport].leagueArr) {
      dates = [];

      if (sport === "football") {
        sports[sport].leagueArr[country].forEach((x) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                from: strToday,
                to: strSunday,
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      } else if (sport === "f1") {
        const eachDay = getDatesInRange(today, sunday);
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  // competition: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      } else {
        const eachDay = getDatesInRange(today, sunday);
        sports[sport].leagueArr[country].forEach((x) => {
          eachDay.forEach((day) => {
            dates.push(
              axios.get(sports[sport].request, {
                headers: { "x-apisports-key": API_KEY },
                params: {
                  season: returnSeason(sport),
                  league: x.id,
                  date: returnUTCString(day),
                  timezone: "Europe/Istanbul",
                },
              })
            );
          });
        });
      }

      await Promise.all(dates)
        .then(
          axios.spread(async (...responses) => {
            responses.forEach((x) => {
              const response = x.data.response;
              response.sort(sortByDate);
              if (response.length > 0) {
                if (
                  !replyArr.includes(
                    `\n\`${returnCountry(sport, response[0])}\`\n`
                  )
                ) {
                  replyArr.push(`\n\`${returnCountry(sport, response[0])}\`\n`);
                }

                if (
                  !replyArr.includes(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  )
                ) {
                  replyArr.push(
                    `\• *${returnLeagueName(sport, response[0])}*\n`
                  );
                }

                response.forEach((game) => {
                  if (
                    !replyArr.includes(`\n\`${returnCountry(sport, game)}\`\n`)
                  ) {
                    replyArr.push(`\n\`${returnCountry(sport, game)}\`\n`);
                  }

                  if (sport === "f1") {
                    // game.timestamp = new Date(game.date).getTime();
                    replyArr.push(
                      `${returnDateF1(game.date)}${game.circuit.name}\n`
                    );
                  } else {
                    replyArr.push(
                      `${convertToDateString(returnTimestamp(sport, game))}${
                        game.teams.home.name
                      } vs ${game.teams.away.name}${
                        returnHomeScore(sport, game) ||
                        returnHomeScore(sport, game) === 0
                          ? ` (${returnHomeScore(
                              sport,
                              game
                            )}-${returnAwayScore(sport, game)})`
                          : ""
                      }\n`
                    );
                  }
                });
              }
            });
          })
        )
        .catch(async (errors) => {
          console.log(errors);
          await say("Something went wrong with the football api.");
        });
    }

    if (replyArr.length > 0) {
      await say(replyArr.join(""));
    } else {
      await say("There is no matches on this day.");
    }
  } else if (
    arr.length === 5 &&
    arr[4]?.toLowerCase() !== "f1" &&
    sports[arr[4]?.toLowerCase()]?.leagueArr[arr[0]?.toLowerCase()] &&
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

    const sport = arr[4]?.toLowerCase();

    if (sport === "football") {
      sports[sport]?.leagueArr[arr[0]].forEach((x) => {
        dates.push(
          axios.get(sports[sport].request, {
            headers: { "x-apisports-key": API_KEY },
            params: {
              season: returnSeason(sport),
              league: x.id,
              from: strToday,
              to: strSunday,
              timezone: "Europe/Istanbul",
            },
          })
        );
      });
    } else {
      const eachDay = getDatesInRange(today, sunday);

      sports[sport]?.leagueArr[arr[0]].forEach((x) => {
        eachDay.forEach((day) => {
          dates.push(
            axios.get(sports[sport].request, {
              headers: { "x-apisports-key": API_KEY },
              params: {
                season: returnSeason(sport),
                league: x.id,
                date: returnUTCString(day),
                timezone: "Europe/Istanbul",
              },
            })
          );
        });
      });
    }

    axios
      .all(dates)
      .then(
        axios.spread(async (...responses) => {
          const replyArr = [];

          responses.forEach((x) => {
            const response = x.data.response;
            response.sort(sortByDate);
            if (response.length > 0) {
              if (
                !replyArr.includes(
                  `\`${returnLeagueName(sport, response[0])}\`\n`
                )
              ) {
                replyArr.push(`\`${returnLeagueName(sport, response[0])}\`\n`);
              }

              response.forEach((game) => {
                replyArr.push(
                  `${convertToDateString(returnTimestamp(sport, game))}${
                    game.teams.home.name
                  } vs ${game.teams.away.name}${
                    returnHomeScore(sport, game) ||
                    returnHomeScore(sport, game) === 0
                      ? ` (${returnHomeScore(sport, game)}-${returnAwayScore(
                          sport,
                          game
                        )})`
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

function returnDateF1(unixDate) {
  let date = new Date(unixDate);
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
  if (a.fixture?.timestamp) {
    if (a.fixture.timestamp < b.fixture.timestamp) {
      return -1;
    }
    if (a.fixture.timestamp > b.fixture.timestamp) {
      return 1;
    }
    return 0;
  } else {
    if (a.timestamp < b.timestamp) {
      return -1;
    }
    if (a.timestamp > b.timestamp) {
      return 1;
    }
    return 0;
  }
}

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());

  const dates = [];

  while (date <= endDate) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}
