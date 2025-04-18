// Static list of Codeforces handles
const handles = [
  "hasnatzadid13",
  "Ether",
  "List_mist25",
  "tanjill",
  "HA_BI_BI",
  "soyad96",
  "Zids",
  "Razoana",
  "Suzit_Datta",
  "Rifatt",
  "mdnrkn",
  "Shekarmanulhoque",
  "Zubayeer_alam",
  "mr_warlock",
  "kingfisher-2",
  "TISHAD07",
  "_Asaduzzaman_",
  "afsanabid.anik",
  "mahir_d_",
  "Faysal_Chowdhury",
  "Xbir",
  "FaisalMahi",
  "Estiyak_Rubaiat",
  "__SADMAN__",
  "jubair7",
  "Mahjabin7",
  "roy420",
  "mrxvaau",
  "arghodey",
  "J_A_Jishan",
  "crux15",
  "NILADRI-18",
  "jafirislam10",
  "_kuhaku",
  "Swajan_",
  "arghodatta",
  "Arnobakd",
  "sadatishraq",
  "Azhar07",
  "_Berlin_",
  "Siyam_Talukder",
  "Miaow",
  "PhantomX",
  "omar_saif",
  "Kazi_Irfan",
  "_Tanjid_",
  "Thrash",
  "LONEWOLF09",
  "Abir_Hamza",
  "S0MS0MM1dA",
  "falcon83",
  "tanvirtasin",
  "OnukromR",
  "Wahiduzzaman_Nejhum",
  "Tasin_t",
  "mehedi-hasan02",
  "mdNishad_001",
  "NIGHT_FURY_sbr",
  "LIGHT_FURY_bkm",
  "Tahsin5586",
  "_Apon",
  "Relbai",
  "Rk899",
  "TonmoySarkar",
  "Alfa.",
  "SadmanOverFlow",
  "tanvir50198",
  "Torikul_Roman",
  "Tanvir___Ahmed",
  "Reaper08",
  "Zero_Tw2",
  "fahadhasan",
  "_tanim",
  "sahedbatman",
  "Al__Ehsan",
  "ameya_",
  "rafishaidul",
  "Meraki_",
  "Kiyas-Mahmud",
  "MoZAhid",
  "Athrix_Rahul",
  "mahdiuzzamannishat",
  "Trifecta",
  "ayanhalder2705",
  "one_above_all7",
  "anas678",
  "jojo33",
  "liteonnehi",
  "AR_ratul",
  "Aursyine_",
  "procastinator24",
  "w4rdaddy",
  "Sharmin_Sultana",
  "Nayem_Siddiki",
  "mhTipu",
  "tawhid_12",
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

  // counter to testing manually for given contests
  let counter = 6;
  let rcontests = contests.reverse(); // Reverse the order to process from oldest to newest.

  // 3. For each contest, fetch standings and compute contest points.
  for (const contest of rcontests) {
    if (counter <= 0) break;
    // Limit the number of contests to process for testing.
    counter--;
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
