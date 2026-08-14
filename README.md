# 반응속도 측정 웹앱

버튼을 클릭해 게임을 시작하면 화면이 파란색으로 바뀌고, 1~12초 사이 무작위 시점에 빨간색으로 변합니다.
빨간색으로 바뀐 뒤 클릭하면 반응 속도(ms)가 초록 화면에 표시되고, 닉네임을 입력해 기록을 저장할 수 있습니다.
빨간색이 되기 전에 클릭하면 실패 처리 후 다시 시작할 수 있습니다.

## 동작 방식

- `state-idle` → 시작 버튼 클릭
- `state-waiting` (파란색) → 1~12초 랜덤 대기, 이 사이 클릭하면 실패
- `state-ready` (빨간색) → 클릭 시 반응 시간 측정
- `state-result` (초록색) → 결과 표시, 닉네임 입력 후 저장, 랭킹(Top 5) 표시
- `state-fail` → 실패 안내 후 재시작

점수 저장/조회 로직은 `js/db.js`의 `saveScore(nickname, ms)`와 `getTop(n)` 두 함수로 분리되어 있습니다.

## 1. Firebase 프로젝트 준비

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트를 만듭니다.
2. 좌측 메뉴 **Build > Firestore Database**에서 데이터베이스를 생성합니다 (프로덕션 모드 선택 후, 아래 3단계에서 규칙을 붙여넣으면 됩니다).
3. **Firestore Database > 규칙** 탭에서 이 저장소의 `firestore.rules` 내용을 그대로 붙여넣고 게시합니다.
4. 프로젝트 개요 옆 톱니바퀴 > **프로젝트 설정 > 일반** 탭에서 "내 앱"을 웹(`</>`) 앱으로 추가합니다. (Firebase Hosting 설정은 건너뛰어도 됩니다.)
5. 앱 등록 후 나오는 `firebaseConfig` 객체 값을 아래 2단계의 GitHub Secrets에 등록합니다.

Firebase 웹 config 값(apiKey 등)은 비밀 값이 아니라 클라이언트에 그대로 노출되는 값입니다. 실제 보안은 `firestore.rules`의 접근 규칙으로 제어됩니다. Secrets로 관리하는 이유는 값을 커밋 히스토리에 평문으로 남기지 않기 위함입니다.

## 2. GitHub Secrets 등록

저장소 **Settings > Secrets and variables > Actions > New repository secret**에서 아래 6개를 등록합니다. 배포 워크플로우가 빌드 시점에 이 값들로 `js/firebase-config.js`를 생성합니다.

| Secret 이름 | Firebase config 필드 |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

로컬 저장소의 `js/firebase-config.js`는 로컬 테스트용 플레이스홀더이며, 실제 배포에는 사용되지 않고 배포 시 위 Secrets 값으로 덮어써집니다.

## 3. GitHub Pages 배포

1. GitHub 저장소 **Settings > Pages**에서 Source를 **GitHub Actions**로 설정합니다.
2. `main` 브랜치에 push되면 `.github/workflows/deploy-pages.yml` 워크플로우가 Secrets로 `firebase-config.js`를 생성한 뒤 정적 파일을 자동 배포합니다.
3. 배포된 주소는 Settings > Pages 화면 또는 Actions 실행 로그에서 확인할 수 있습니다.

## 로컬에서 확인하기

빌드 과정 없이 정적 파일로 동작하므로, 아래처럼 간단한 정적 서버로 확인할 수 있습니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속 후 확인합니다. (module script를 사용하므로 `file://`로 바로 열면 동작하지 않습니다.)
