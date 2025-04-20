function getContestPoints(localRank) {
  const idx = localRank - 1;
  return scoreToGet[idx] !== undefined
    ? scoreToGet[idx]
    : scoreToGet[scoreToGet.length - 1];
}

/* Utility: Round up to 2 decimal places */
function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}

function computeTotalPoints(contestPoints) {
  const N = contestPoints.length;
  const X = Math.ceil((7 * N) / 10);
  return contestPoints
    .slice()
    .sort((a, b) => b - a)
    .slice(0, X)
    .reduce((s, v) => s + v, 0);
}

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

function getContests() {
  return fetch("https://codeforces.com/api/contest.list")
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== "OK") throw new Error("Contest list API error");
      const seasonStart = new Date("2025-02-02T00:00:00Z").getTime() / 1000;
      const seasonEnd = new Date("2025-12-31T23:59:59Z").getTime() / 1000;
      return data.result
        .filter(
          (c) =>
            c.phase === "FINISHED" &&
            c.startTimeSeconds >= seasonStart &&
            c.startTimeSeconds <= seasonEnd &&
            !c.name.toLowerCase().includes("unrated") &&
            (c.name.includes("Div. 2") || c.name.includes("Educational"))
        )
        .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);
    })
    .catch((err) => {
      console.error("Error fetching contests:", err);
      return [];
    });
}

(async function main() {
  const usersInfo = await getUsersInfo(handles);
  const users = usersInfo.map((u) => ({
    handle: u.handle,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.handle,
    rating: u.rating || 0,
    contests: [],
    total: 0,
  }));

  const contests = await getContests();
  for (const contest of contests) {
    await new Promise((r) => setTimeout(r, 1000)); // rate-limit 1s
    let rows = [];
    try {
      const resp = await fetch(
        `https://codeforces.com/api/contest.standings?contestId=${
          contest.id
        }&handles=${handles.join(";")}`
      );
      const json = await resp.json();
      if (json.status === "OK") rows = json.result.rows;
    } catch (e) {
      console.error(e);
    }

    const part = rows
      .filter((r) => r.party && r.party.members.length)
      .sort((a, b) => a.rank - b.rank);

    const groups = {};
    part.forEach((r, i) => {
      groups[r.rank] = groups[r.rank] || [];
      groups[r.rank].push(i);
    });

    const contestPts = {};
    Object.values(groups).forEach((indices) => {
      const sum = indices.reduce(
        (acc, idx) => acc + getContestPoints(idx + 1),
        0
      );
      const avg = sum / indices.length;
      indices.forEach((idx) => {
        const h = part[idx].party.members[0].handle;
        contestPts[h] = roundToTwo(avg);
      });
    });

    users.forEach((u) => u.contests.push(contestPts[u.handle] || 0));
  }

  users.forEach((u) => (u.total = roundToTwo(computeTotalPoints(u.contests))));
  users.sort((a, b) => b.total - a.total);

  renderTable(users, contests);
})();

// Render leaderboard
function renderTable(users, contests) {
  const container = document.getElementById("table-container");
  let html =
    `<table class="table table-dark mt-3"><thead><tr>` +
    `<th>Rank</th><th>Handle (Name)</th><th>Total</th>`;
  contests.forEach((c) => (html += `<th>${c.name}</th>`));
  html += `</tr></thead><tbody>`;
  users.forEach((u, i) => {
    html += `<tr><td>${i + 1}</td><td>`;
    let clr = "rgb(127,127,127)";
    const r = u.rating;
    if (r >= 1200 && r < 1400) clr = "rgb(72,127,30)";
    else if (r >= 1400 && r < 1600) clr = "rgb(144,255,255)";
    else if (r >= 1600 && r < 1900) clr = "rgb(75,96,250)";
    html += `<a href="https://codeforces.com/profile/${u.handle}" target="_blank" style="color:${clr}"><strong>${u.handle}</strong></a> (${u.name})`;
    html += `</td><td>${u.total.toFixed(2)}</td>`;
    u.contests.forEach((s) => (html += `<td>${s}</td>`));
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}
