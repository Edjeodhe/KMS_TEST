import { firebaseConfig } from "./firebase-config.js";

let scoresRefPromise = null;

// Firebase SDK를 지연 로드해서, CDN에 접속할 수 없는 환경에서도
// 게임 자체(반응속도 측정)는 항상 동작하고 랭킹/저장만 실패하도록 분리한다.
function getScoresRef() {
  if (!scoresRefPromise) {
    scoresRefPromise = (async () => {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getFirestore, collection } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      return collection(db, "scores");
    })();
  }
  return scoresRefPromise;
}

export async function saveScore(nickname, ms) {
  const { addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const scoresRef = await getScoresRef();
  await addDoc(scoresRef, {
    nickname,
    ms,
    createdAt: serverTimestamp(),
  });
}

export async function getTop(n) {
  const { query, orderBy, limit, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const scoresRef = await getScoresRef();
  const q = query(scoresRef, orderBy("ms", "asc"), limit(n));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    nickname: doc.data().nickname,
    ms: doc.data().ms,
  }));
}
