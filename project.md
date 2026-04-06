# 사장봇 (SajangBot) 프로젝트 구조

## Backend 구조
backend/
├── main.py                  # FastAPI 앱 진입점
├── config.py                # 환경변수 설정
├── database.py              # DB 세션 생성 및 관리
├── api/
│   ├── init.py
│   └── router.py            # 라우터 통합
├── modules/
│   ├── user/                # 사용자 인증 모듈
│   │   ├── init.py
│   │   ├── models.py        # DB 테이블 정의
│   │   ├── schemas.py       # Pydantic 유효성 검증
│   │   ├── router.py        # API 경로 정의
│   │   ├── crud.py          # DB 입출력
│   │   └── service.py       # 비즈니스 로직
│   ├── generate/            # 콘텐츠 생성 모듈
│   │   ├── init.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── router.py
│   │   ├── crud.py
│   │   └── service.py
│   └── history/             # 히스토리 모듈
│       ├── init.py
│       ├── models.py
│       ├── schemas.py
│       ├── router.py
│       ├── crud.py
│       └── service.py

## Frontend 구조
frontend/
├── index.html               # 홈 페이지
├── css/
│   └── my_styles.css        # 스타일
├── js/
│   └── my_script.js         # JS
└── html/
├── login.html           # 로그인
├── register.html        # 회원가입
├── mypage.html          # 마이페이지
└── generate.html        # 콘텐츠 생성

## 모듈 설명

| 파일 | 역할 |
|------|------|
| `models.py` | DB 테이블 구조 정의 (SQLAlchemy) |
| `schemas.py` | 입출력 데이터 형식 정의 (Pydantic) |
| `router.py` | API 경로 연결 |
| `crud.py` | DB 직접 입출력 (Create·Read·Update·Delete) |
| `service.py` | 비즈니스 로직 (암호화·AI 호출 등) |

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | HTML · CSS · JS |
| Backend | FastAPI · Python |
| Database | SQLite (개발) → PostgreSQL (운영) |
| AI | OpenAI GPT-4o-mini |
| Infra | Docker · AWS EC2 · GitHub Actions |