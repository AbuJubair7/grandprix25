const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as templating engine and serve static files
app.set("view engine", "ejs");
app.use(express.static("public"));

// Static list of handles
const handles = [
  "Xbir",
  "Faysal_Chowdhury",
  "Ether",
  "Reaper08",
  "jubair7",
  "tanvirtasin",
  "Siyam_Talukder",
  "Kazi_Irfan",
  "Miaow",
  "mr_warlock",
  "Abir_Hamza",
  "HA_BI_BI",
  "kingfisher-2",
  "mdNishad_001",
  "Mahjabin7",
  "mahdiuzzamannishat",
  "Azhar07",
  "_kuhaku",
  "Zids",
  "mdnrkn",
  "Asaduzzaman",
  "tanjill",
  "Tasin_t",
  "mehedi-hasan02",
  "mhTipu",
  "Suzit_Datta",
  "LONEWOLF09",
  "NILADRI-18",
  "fahadhasan",
  "J_A_Jishan",
  "Al__Ehsan",
  "one_above_all7",
  "tanvir50198",
  "Swajan_",
  "Berlin",
  "OnukromR",
  "mahir_d_",
  "AR_ratul",
  "Kiyas-Mahmud",
  "Razoana",
  "S0MS0MM1dA",
  "Zero_Tw2",
  "Meraki_",
  "Aursyine_",
];

/**
 * Fetch user info from Codeforces API for the given handles.
 */
async function getUsersInfo(handles) {
  try {
    const handlesParam = handles.join(";");
    const apiUrl = `https://codeforces.com/api/user.info?handles=${handlesParam}`;
    const response = await axios.get(apiUrl);
    if (response.data.status !== "OK") {
      throw new Error("Error fetching user info from Codeforces API");
    }
    return response.data.result;
  } catch (error) {
    console.error("Error fetching users info:", error);
    return [];
  }
}

/**
 * Retrieve the contest list from Codeforces API that matches:
 * - Finished contests between Feb 2, 2025 and Dec 31, 2025.
 * - Contests whose names include "Div. 2" and either "Codeforces Round" or "Educational".
 */
async function getContests() {
  try {
    const response = await axios.get("https://codeforces.com/api/contest.list");
    if (response.data.status !== "OK")
      throw new Error("Contest list API error");
    let contests = response.data.result;
    const seasonStart = new Date("2025-02-02T00:00:00Z").getTime() / 1000;
    const seasonEnd = new Date("2025-12-31T23:59:59Z").getTime() / 1000;
    contests = contests.filter((contest) => {
      return (
        contest.phase === "FINISHED" &&
        contest.startTimeSeconds >= seasonStart &&
        contest.startTimeSeconds <= seasonEnd &&
        contest.name.includes("Div. 2") &&
        (contest.name.includes("Codeforces Round") ||
          contest.name.includes("Educational"))
      );
    });
    // Sort contests with the most recent contest first.
    contests.sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);
    return contests;
  } catch (error) {
    console.error("Error fetching contests:", error);
    return [];
  }
}

/**
 * Returns contest points based on the local rank among static handles.
 */
function getContestPoints(localRank) {
  if (localRank === 1) return 100;
  if (localRank === 2) return 70;
  if (localRank === 3) return 56;
  if (localRank === 4) return 47;
  if (localRank === 5) return 41;
  if (localRank === 6) return 36;
  if (localRank === 7) return 32;
  if (localRank === 8) return 28;
  if (localRank === 9) return 25;
  if (localRank === 10) return 22;
  if (localRank === 11) return 20;
  if (localRank === 12) return 18;
  if (localRank === 13) return 16;
  if (localRank === 14) return 14;
  if (localRank === 15) return 12;
  if (localRank === 16) return 10;
  if (localRank === 17) return 8;
  if (localRank === 18) return 6;
  if (localRank === 19) return 4;
  if (localRank === 20) return 2;
  return 1;
}

/**
 * Computes total points for a user by summing the best X contest scores,
 * where X = ceil(7N/10) and N is the number of contests.
 */
function computeTotalPoints(contestPoints) {
  const N = contestPoints.length;
  const X = Math.ceil((7 * N) / 10);
  const bestScores = contestPoints
    .slice()
    .sort((a, b) => b - a)
    .slice(0, X);
  return bestScores.reduce((sum, score) => sum + score, 0);
}

app.get("/", async (req, res) => {
  try {
    // 1. Get user info for the static handles.
    const usersInfo = await getUsersInfo(handles);
    let users = usersInfo.map((user) => ({
      handle: user.handle,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.handle,
      rating: user.rating || 0,
      contests: [], // Will hold contest points for each contest.
      total: 0,
    }));
    // Create a lookup map for quick updates.
    let userMap = {};
    users.forEach((user) => {
      userMap[user.handle] = user;
    });

    // 2. Get contests for the season.
    const contests = await getContests();

    // 3. For each contest, fetch standings for the static handles and compute local ranking.
    for (const contest of contests) {
      const handlesParam = handles.join(";");
      const url = `https://codeforces.com/api/contest.standings?contestId=${contest.id}&handles=${handlesParam}`;
      try {
        const response = await axios.get(url);
        if (response.data.status !== "OK") {
          console.error("Error fetching standings for contest", contest.id);
          // If there's an error, push 0 points for all users.
          users.forEach((user) => user.contests.push(0));
          continue;
        }
        const rows = response.data.result.rows || [];
        // Filter only rows with valid participation.
        const participated = rows.filter((row) => {
          return row.party && row.party.members && row.party.members.length > 0;
        });
        // Sort the participated rows by global rank (ascending).
        participated.sort((a, b) => a.rank - b.rank);

        // Reassign local ranking among the static handles.
        // For unsolved users (row.points === 0) with equal global ranks, assign the same local rank.
        const localRankMap = {};
        let lastLocalRank = 0;
        for (let i = 0; i < participated.length; i++) {
          const row = participated[i];
          const handle = row.party.members[0].handle;
          const solved = row.points > 0;
          const currentGlobalRank = row.rank;
          // For unsolved users, if the previous unsolved user has the same global rank, assign the same rank.
          if (i > 0) {
            const prevRow = participated[i - 1];
            const prevSolved = prevRow.points > 0;
            const prevGlobalRank = prevRow.rank;
            if (
              !solved &&
              !prevSolved &&
              currentGlobalRank === prevGlobalRank
            ) {
              localRankMap[handle] = {
                rank: lastLocalRank,
                solved,
                globalRank: currentGlobalRank,
              };
              continue;
            }
          }
          lastLocalRank += 1;
          localRankMap[handle] = {
            rank: lastLocalRank,
            solved,
            globalRank: currentGlobalRank,
          };
        }

        // For each static handle, assign contest points based on local rank and whether they solved any problem.
        users.forEach(function (user) {
          let points = 0;
          if (localRankMap[user.handle] !== undefined) {
            const localData = localRankMap[user.handle];
            if (!localData.solved) {
              // User did not solve any problem.
              if (localData.rank >= 1 && localData.rank <= 20) {
                points = 1.14;
              } else {
                points = 1;
              }
            } else {
              // User solved at least one problem; use the original points scheme.
              points = getContestPoints(localData.rank);
            }
          }
          user.contests.push(points);
        });
      } catch (err) {
        console.error("Error processing contest", contest.id, err);
        // If error, push 0 points for everyone.
        users.forEach((user) => user.contests.push(0));
      }
    }

    // 4. Compute total score for each user.
    users.forEach(function (user) {
      user.total = computeTotalPoints(user.contests);
    });

    // 5. Sort users by total descending.
    users.sort(function (a, b) {
      return b.total - a.total;
    });

    res.render("index", { users: users, contests: contests });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
