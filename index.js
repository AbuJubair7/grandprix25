// Static list of Codeforces handles
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
  "_Asaduzzaman_",
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
  "_Berlin_",
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

/* --- Helper Functions --- */

// Returns contest points based on the local rank.
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

// Computes total points by summing the best X contest scores.
function computeTotalPoints(contestPoints) {
  const N = contestPoints.length;
  const X = Math.ceil((7 * N) / 10);
  const bestScores = contestPoints
    .slice()
    .sort((a, b) => b - a)
    .slice(0, X);
  return bestScores.reduce((sum, score) => sum + score, 0);
}

/* --- API Functions using fetch --- */

// Fetch user info for all handles.
function getUsersInfo(handles) {
  const handlesParam = handles.join(";");
  const url = `https://codeforces.com/api/user.info?handles=${handlesParam}`;
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== "OK") throw new Error("Error fetching user info");
      return data.result;
    })
    .catch((err) => {
      console.error("Error fetching users info:", err);
      return [];
    });
}

// Fetch contests that match our criteria.
function getContests() {
  return fetch("https://codeforces.com/api/contest.list")
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== "OK") throw new Error("Contest list API error");
      let contests = data.result;
      const seasonStart = new Date("2025-02-02T00:00:00Z").getTime() / 1000;
      const seasonEnd = new Date("2025-12-31T23:59:59Z").getTime() / 1000;
      contests = contests.filter((contest) => {
        return (
          contest.phase === "FINISHED" &&
          contest.startTimeSeconds >= seasonStart &&
          contest.startTimeSeconds <= seasonEnd &&
          // Only include rated contests: skip if "unrated" appears (case-insensitive)
          !contest.name.toLowerCase().includes("unrated") &&
          // Must be a Div. 2 round or Educational round
          (contest.name.includes("Div. 2") ||
            contest.name.includes("Educational"))
        );
      });
      // Sort with most recent contest first.
      contests.sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);
      return contests;
    })
    .catch((err) => {
      console.error("Error fetching contests:", err);
      return [];
    });
}

// // Fetch contests that match our criteria.
// function getContests() {
//   return fetch("https://codeforces.com/api/contest.list")
//     .then((res) => res.json())
//     .then((data) => {
//       if (data.status !== "OK") throw new Error("Contest list API error");
//       let contests = data.result;
//       const seasonStart = new Date("2025-02-02T00:00:00Z").getTime() / 1000;
//       const seasonEnd = new Date("2025-12-31T23:59:59Z").getTime() / 1000;
//       contests = contests.filter((contest) => {
//         return (
//           contest.phase === "FINISHED" &&
//           contest.startTimeSeconds >= seasonStart &&
//           contest.startTimeSeconds <= seasonEnd &&
//           contest.name.includes("Div. 2") &&
//           (contest.name.includes("Codeforces Round") ||
//             contest.name.includes("Educational"))
//         );
//       });
//       // Sort with most recent contest first.
//       contests.sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);
//       return contests;
//     })
//     .catch((err) => {
//       console.error("Error fetching contests:", err);
//       return [];
//     });
// }

/* --- Main Function --- */
(async function main() {
  // 1. Get user information.
  const usersInfo = await getUsersInfo(handles);
  let users = usersInfo.map((user) => ({
    handle: user.handle,
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ") || user.handle,
    rating: user.rating || 0,
    contests: [], // contest points per contest
    total: 0,
  }));

  // 2. Get contest list.
  const contests = await getContests();

  // 3. For each contest, fetch standings and compute contest points.
  for (const contest of contests) {
    const handlesParam = handles.join(";");
    const url = `https://codeforces.com/api/contest.standings?contestId=${contest.id}&handles=${handlesParam}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== "OK") {
        console.error("Error fetching standings for contest", contest.id);
        users.forEach((user) => user.contests.push(0));
        continue;
      }
      const rows = json.result.rows || [];
      // Filter rows with valid participation.
      const participated = rows.filter((row) => {
        return row.party && row.party.members && row.party.members.length > 0;
      });
      // Sort by global rank.
      participated.sort((a, b) => a.rank - b.rank);

      // Compute local ranking for each handle.
      const localRankMap = {};
      let lastLocalRank = 0;
      for (let i = 0; i < participated.length; i++) {
        const row = participated[i];
        const handle = row.party.members[0].handle;
        const solved = row.points > 0;
        const currentGlobalRank = row.rank;
        if (i > 0) {
          const prevRow = participated[i - 1];
          const prevSolved = prevRow.points > 0;
          const prevGlobalRank = prevRow.rank;
          if (!solved && !prevSolved && currentGlobalRank === prevGlobalRank) {
            localRankMap[handle] = {
              rank: lastLocalRank,
              solved,
              globalRank: currentGlobalRank,
            };
            continue;
          }
        }
        lastLocalRank++;
        localRankMap[handle] = {
          rank: lastLocalRank,
          solved,
          globalRank: currentGlobalRank,
        };
      }

      // Assign contest points for each user.
      users.forEach((user) => {
        let points = 0;
        if (localRankMap[user.handle] !== undefined) {
          const localData = localRankMap[user.handle];
          if (!localData.solved) {
            points = localData.rank >= 1 && localData.rank <= 20 ? 1.14 : 1;
          } else {
            points = getContestPoints(localData.rank);
          }
        }
        user.contests.push(points);
      });
    } catch (err) {
      console.error("Error processing contest", contest.id, err);
      users.forEach((user) => user.contests.push(0));
    }
  }

  // 4. Compute total points per user and sort descending.
  users.forEach((user) => {
    user.total = computeTotalPoints(user.contests);
  });
  users.sort((a, b) => b.total - a.total);

  // 5. Render the table.
  renderTable(users, contests);
})();

/* --- Render Function --- */
function renderTable(users, contests) {
  const container = document.getElementById("table-container");
  let html = `<table class="table table-dark mt-3">
      <thead>
        <tr>
          <th>#</th>
          <th>Handle (Name)</th>
          <th>Total</th>`;
  contests.forEach((contest) => {
    html += `<th>${contest.name}</th>`;
  });
  html += `</tr>
      </thead>
      <tbody>`;
  users.forEach((user, index) => {
    html += `<tr>
        <td>${index + 1}</td>
        <td>`;
    // Set handle color based on rating.
    let color = "rgb(127,127,127)";
    if (user.rating >= 1200 && user.rating < 1400) color = "rgb(72,127,30)";
    else if (user.rating >= 1400 && user.rating < 1600)
      color = "rgb(144,255,255)";
    else if (user.rating >= 1600 && user.rating < 1900)
      color = "rgb(75,96,250)";
    html += `<a href="https://codeforces.com/profile/${
      user.handle
    }" target="_blank" style="color:${color}"><strong>${
      user.handle
    }</strong></a> (${user.name})
        </td>
        <td>${user.total.toFixed(2)}</td>`;
    user.contests.forEach((score) => {
      html += `<td>${score}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}
