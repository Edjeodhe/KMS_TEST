import { saveScore, getTop } from "./db.js";

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 12000;
const LEADERBOARD_SIZE = 5;

const screenEl = document.getElementById("screen");
const contentEl = document.getElementById("content");

let state = "idle";
let delayTimeoutId = null;
let readyStartTime = 0;

function setState(next) {
  state = next;
  screenEl.className = `screen state-${next}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function startRound() {
  clearTimeout(delayTimeoutId);
  setState("waiting");
  contentEl.innerHTML = `
    <h1>대기 중...</h1>
    <p>화면이 빨간색으로 바뀌면 클릭하세요. 지금 클릭하면 실패합니다.</p>
  `;
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  delayTimeoutId = setTimeout(() => {
    setState("ready");
    contentEl.innerHTML = `<h1>지금 클릭!</h1>`;
    readyStartTime = performance.now();
  }, delay);
}

function failRound() {
  clearTimeout(delayTimeoutId);
  setState("fail");
  contentEl.innerHTML = `
    <h1>너무 빨리 클릭했습니다!</h1>
    <p>빨간색으로 바뀐 뒤에 클릭해주세요.</p>
    <div class="actions">
      <button id="retry-btn" type="button">다시 시작</button>
    </div>
  `;
  document.getElementById("retry-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    startRound();
  });
}

function succeedRound() {
  const ms = Math.round(performance.now() - readyStartTime);
  setState("result");
  contentEl.innerHTML = `
    <h1>결과</h1>
    <div class="ms-result">${ms}ms</div>
    <div class="nickname-form">
      <input id="nickname-input" type="text" maxlength="20" placeholder="닉네임" />
      <button id="save-btn" type="button">저장</button>
    </div>
    <div id="leaderboard-container"></div>
    <div class="actions">
      <button id="restart-btn" type="button">다시 시작</button>
    </div>
  `;

  const leaderboardEl = document.getElementById("leaderboard-container");
  refreshLeaderboard(leaderboardEl);

  document.getElementById("save-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    const input = document.getElementById("nickname-input");
    const saveBtn = document.getElementById("save-btn");
    const nickname = input.value.trim().slice(0, 20) || "익명";

    input.disabled = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "저장 중...";

    try {
      await saveScore(nickname, ms);
      saveBtn.textContent = "저장 완료";
      refreshLeaderboard(leaderboardEl);
    } catch (err) {
      saveBtn.textContent = "저장 실패";
      saveBtn.disabled = false;
      input.disabled = false;
      console.error(err);
    }
  });

  document.getElementById("restart-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    startRound();
  });
}

async function refreshLeaderboard(containerEl) {
  containerEl.innerHTML = `<div class="leaderboard"><p>랭킹 불러오는 중...</p></div>`;
  try {
    const top = await getTop(LEADERBOARD_SIZE);
    if (top.length === 0) {
      containerEl.innerHTML = `<div class="leaderboard"><h2>랭킹 TOP ${LEADERBOARD_SIZE}</h2><p>아직 기록이 없습니다.</p></div>`;
      return;
    }
    const items = top
      .map((entry, idx) => `<li class="${idx === 0 ? "best" : ""}">${escapeHtml(entry.nickname)} - ${entry.ms}ms</li>`)
      .join("");
    containerEl.innerHTML = `
      <div class="leaderboard">
        <h2>랭킹 TOP ${LEADERBOARD_SIZE} (최고기록: ${top[0].ms}ms)</h2>
        <ol>${items}</ol>
      </div>
    `;
  } catch (err) {
    containerEl.innerHTML = `<div class="leaderboard"><p>랭킹을 불러오지 못했습니다. Firebase 설정을 확인해주세요.</p></div>`;
    console.error(err);
  }
}

screenEl.addEventListener("click", () => {
  if (state === "waiting") {
    failRound();
  } else if (state === "ready") {
    succeedRound();
  }
});

document.getElementById("start-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  startRound();
});
