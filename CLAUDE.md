# Admin Web Rules (`codingpt_admin/`)

React 18 + Vite 어드민 웹앱 (구 `codingpt_service/codingpt_front` → 2026-06 리네임 → 2026-06 `codingpt_service`에서 **최상위 독립 프로젝트로 분리**). 페이지 기반 라우팅.
배포: `codingpt-admin.ghmate.com` (compose 서비스명 `admin`, 컨테이너 `codingpt_admin_{env}`). 백엔드와는 **공개 HTTPS(`codingpt-back.ghmate.com`)로만 통신** — `codingpt_service`와 코드/네트워크 결합 없음. 공개 랜딩/결제/웹코딩은 별도 `codingpt_service/codingpt_front`(Next.js).

## 배포
```bash
./deploy.sh dev   # /srv/projects/codingpt_admin, docker-compose.dev.yml
./deploy.sh stg
./deploy.sh prod
```
홈서버 nginx vhost(`codingpt-admin.ghmate.com` → `codingpt_admin_prod:80`)는 GHMATE_SERVER_GUIDE 패턴.

---

## 스타일링

- Tailwind CSS utility class 사용 (`className="..."`)
- 인라인 스타일 / 별도 CSS 파일 신규 생성 지양
- 커스텀 설정: `tailwind.config.js`

---

## 컴포넌트 구조

- `src/components/` — 기능별 폴더 (admin, curriculum, lesson, tts 등)
- `src/pages/` — 페이지 레벨 컴포넌트 (Main, Code, Execute, Lesson, Admin, TTS)
- `Execute.jsx` — 의도적으로 대형 단일 컴포넌트 (코드 미리보기 + 실행), 분리 요청 없으면 유지

---

## 코드 에디터

- Monaco Editor 사용 (`@monaco-editor/react`)
- Vite 빌드 설정에서 Monaco 워커 처리 포함 (`vite.config.js` 참조)

---

## 환경 설정

- 개발 서버 포트: **3300** (`vite.config.js`)
- 환경변수: `VITE_BACKEND_URL` 등 `VITE_` 접두사
- 환경 파일: `.env.local`, `.env.dev`, `.env.stg`, `.env`
