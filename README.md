# 사장봇 (SajangBot)

> **"ChatGPT는 글을 써주지만, 사장봇은 네이버에서 검색되는 글을 써줍니다."**
>
> 키워드 하나로 블로그 · 리뷰 · 쇼츠 대본 · 썸네일 문구까지 자동 생성하는 소상공인 AI 마케팅 도구

---

## 🚀 배포 현황

| 구분 | 주소 | 상태 |
|------|------|------|
| 테스트 서버 | http://13.125.46.112:8000 | ✅ 운영 중 (2026-04-22 배포 완료) |
| 운영 서버 | http://3.39.126.61:8000 | 🔧 세팅완료(테스트중) — 발표용 |

> ⚠️ **서버 혼용 금지** — 키페어 및 접속 정보 공유 금지. 도메인 연결은 발표 D-7일 결정 후 최종 서버 1대에만.

---

## 📌 시작하기 (로컬 개발)

### 1. 클론
```bash
git clone https://github.com/gyullby11/owner_bot.git
cd owner_bot
```

### 2. 환경변수 세팅
```bash
cd backend
cp .env.example .env
```
→ `.env` 열어서 본인 `OPENAI_API_KEY` 직접 입력  
→ [platform.openai.com](https://platform.openai.com) → API keys에서 발급 가능

### 3. 실행
```bash
docker-compose up
```
> ⚠️ `docker compose`(공백) 아님. 반드시 `docker-compose`(하이픈) 사용

- 백엔드: http://localhost:8000
- API 문서: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health

### 4. EC2 운영 배포
```bash
docker-compose -f docker-compose.prod.yml up -d
```
- 운영용 환경변수 템플릿: `backend/.env.prod.example`
- 상세 배포 가이드: `docs/ec2-deploy.md`

---

## 🌿 브랜치 규칙

| 브랜치 | 용도 | 직접 push |
|--------|------|-----------|
| `main` | 최종 발표용 배포 | ❌ 금지 |
| `dev` | 통합 개발 | ❌ 금지 |
| `feature/기능명` | 개인 개발 | ✅ 가능 |

### 배포 일정
| 시점 | 브랜치 |
|------|--------|
| 지금 ~ 5월4 일 | `dev` 브랜치 (테스트 서버만) |
| 5월 4일 오후5시 | `main` 브랜치로 전환, 기능 동결 |
| 5월 14일 발표 | `main` 브랜치 최신 커밋 기준 서버 1대만 운영 |

---

## 🔄 작업 순서 (매번)

### 작업 시작
```bash
git checkout dev
git pull origin dev
git checkout -b feature/기능이름
```

### 작업 완료 후
```bash
git add .
git commit -m "feat: 작업내용"
git push origin feature/기능이름
```
→ GitHub에서 PR 올리기 (base: `dev`)  
→ 가영이 확인 후 머지

---

## ✍️ 커밋 메시지 규칙

| 태그 | 의미 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷 |
| `refactor` | 리팩토링 |

---

## 📁 프로젝트 폴더 구조

```
owner_bot/
├── .github/
│   ├── workflows/
│   │   └── deploy.yml          # CI/CD GitHub Actions ✅
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/
│   ├── modules/
│   │   ├── generate/           # 콘텐츠 생성 API ✅
│   │   │   ├── prompt_builder.py  # 10개 업종 × 4종 콘텐츠 Few-Shot ✅
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── history/            # 히스토리 & 크레딧 ✅
│   │   ├── mypage/             # 마이페이지 & 충전 패키지 API ✅
│   │   └── user/               # 회원가입 · 로그인 · JWT ✅
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── .env.prod.example
├── frontend/
│   ├── index.html              # 랜딩 페이지 ✅
│   ├── generate.html           # 콘텐츠 생성 화면 ✅
│   ├── login.html              # 로그인 ✅
│   ├── mypage.html             # 마이페이지 (충전 UI 미완성 🔧)
│   ├── css/
│   │   └── my_styles.css
│   └── js/
│       ├── api.js              # API 모듈 ✅
│       ├── auth.js             # 인증 모듈 ✅
│       └── my_script.js        # 메인 스크립트 (재생성 API 연결 미완성 🔧)
├── docs/
│   └── ec2-deploy.md
├── docker-compose.yml          # 로컬 개발용
└── docker-compose.prod.yml     # EC2 운영 배포용
```

---

## ⚙️ 핵심 기능 현황

| 기능 | 상태 | 담당 |
|------|------|------|
| 10개 업종 × 4종 콘텐츠 생성 (블로그/리뷰/쇼츠/썸네일) | ✅ 완료 | 가영 |
| 네이버 SEO 특화 프롬프트 (C-Rank·D.I.A+ 로직) | ✅ 완료 | 가영 |
| JWT 회원가입 · 로그인 · 닉네임 중복 체크 | ✅ 완료 | 동제 |
| 크레딧 차감 · 충전 API (라이트/베이직/프로) | ✅ 완료 | 동제 |
| 비로그인 IP 1회 제한 | ✅ 완료 | 동제 |
| 히스토리 목록 · 상세 · 재생성 API | ✅ 완료 | 동제 |
| CI/CD GitHub Actions | ✅ 완료 | 가영 |
| EC2 테스트 서버 배포 | ✅ 완료 (04-22) | 가영 |
| 랜딩 페이지 · SEO 뱃지 · ChatGPT 비교 섹션 | ✅ 완료 | 가영 |
| generate.html UI · 탭 · 히스토리 모달 | ✅ 완료 | 제민 |
| 마이페이지 실제 데이터 연동 | ✅ 완료 | 제민 |
| 재생성 버튼 → POST /history/{id}/regenerate 연결 | ✅ 완료 | 제민 |
| 마이페이지 충전 패키지 카드 UI |  ✅ 완료 | 제민 |
| 크레딧 소진 시 패키지 선택 모달 (402 처리)|  ✅ 완료 | 제민 |
| EC2 운영 서버 배포 + HTTPS (nginx + certbot) | ✅ 완료 | 정원 |
| React 컴포넌트 개발 |  ✅ 완료 | 동주 |

---

## 💳 요금제 (BM 재설계 반영)

| 플랜 | 금액 | 크레딧 | 회당 단가 |
|------|------|--------|----------|
| 무료 체험 | 0원 | 가입 시 3회 | - |
| 라이트 (Light) | 3,900원 | 3회 | 1,300원/회 |
| 베이직 (Basic) | 9,900원 | 10회 | 990원/회 |
| 프로 (Pro) | 19,900원 | 25회 | 796원/회 |

> 월 구독 MVP 제외 — 현장 인터뷰 4건 기반으로 건당 결제 선호 확인. 헤비유저 데이터 쌓인 후 재검토.

---

## 📌 프론트 작업 규칙

1. `generate.html`, `my_script.js` 수정 시 동시 수정하면 충돌 날 수 있어요.
2. PR 올리기 전에 반드시:
   ```bash
   git pull origin dev
   ```
   충돌 있으면 직접 해결 후 PR 올리기.
3. **서버에서 파일 직접 수정 금지** — 수정은 git에서, 서버는 pull 또는 재배포만.

---

## ❌ 절대 금지

- `main`, `dev`에 직접 push
- `.env` 파일 커밋 (API 키 노출)
- EC2 서버 내 파일 직접 수정
- 키페어(`.pem`) 분실 또는 타인 공유

---

## 👥 팀원

| 이름 | 역할 | 주요 담당 |
|------|------|---------|
| 유가영 | PM + AI / DevOps | 기획 총괄, 프롬프트 설계, CI/CD, 브랜치 관리 |
| 박동제 | Backend 1 | JWT 인증, 크레딧 차감/충전, 히스토리 재생성 API |
| 이제민 | Frontend | HTML/CSS/JS UI 구현, 마이페이지, 히스토리 |
| 김정원 | Backend 2 / Infra | EC2 운영 서버 배포, HTTPS, nginx 설정 |
| 유동주 | React 개발 | React 컴포넌트 개발 |

---

## 🗓️ 발표 전날 최종 체크리스트

- [ ] 최종 서버 1대 공식 결정 (발표 D-3일)
- [ ] `main` 브랜치 최신 코드 배포 확인
- [ ] `http://[퍼블릭IP]:8000/health` 응답 확인
- [ ] 회원가입 → 로그인 → 콘텐츠 생성 전체 플로우 테스트
- [ ] 발표용 테스트 계정 생성 + 크레딧 충전
- [ ] 서버 재시작 후 DB 데이터 유지 확인
- [ ] 현재 서버 커밋 해시 기록 (`git log --oneline -1`)
- [ ] `.env.prod` 항목 누락 없는지 확인
- [ ] 브라우저 콘솔 CORS 오류 없는지 확인

---

*사장봇 (SajangBot) | GitHub: [gyullby11/owner_bot](https://github.com/gyullby11/owner_bot) | 발표: 2026-05-14*
