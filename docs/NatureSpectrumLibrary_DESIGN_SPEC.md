# NatureSpectrumLibrary — GitHub Pages 정적 웹서비스 상세 설계서

**문서 버전:** 1.0.0  
**기준 데이터:** `에너지축_핵종라이브러리_Energy_Axis_Nuclide_Library.xlsx` (13 sheets)  
**서비스명:** `NatureSpectrumLibrary`  
**목표 배포:** GitHub Pages / 정적 HTML + CSS + JavaScript  
**설계 원칙:** 전문성 · 직관성 · 데이터 보존 · 무의존성 · 반응형 · 접근성 · 보안 경고의 명확화

---

## 1. 목적

NatureSpectrumLibrary는 감마선 스펙트럼에서 관측된 에너지를 출발점으로 하여 다음 질문을 순차적으로 해결하는 교육·훈련·연구용 정적 웹 애플리케이션이다.

> **관측 에너지 → 후보 핵종 → 발생원 → 화학형태 → 주요 시료 → 적합 검출기 → 간섭/유의사항 → 근거 문헌**

원본 Excel의 13개 시트와 설명문을 최대한 손실 없이 제공하면서, 웹에서는 Excel보다 빠른 검색·필터·비교·역추적·계산·링크 공유가 가능하도록 한다.

---

## 2. 원본 데이터 구조 분석

| 구분 | 원본 시트 | 웹 기능 |
|---|---|---|
| 안내 | `00_README` | 시작 화면, 범례, 설계 원칙, 사용 흐름 |
| 핵심 원장 | `01_에너지지도_MASTER` | 에너지/핵종 탐색기, 필터, 정렬, 상세 패널 |
| 검출기 | `02_검출기_에너지창` | 검출기 비교, FWHM 계산, 에너지창 판정 |
| 에너지별 심층 | `03`–`06` | 저/중/고/초고 에너지 대역별 전문 해설 |
| 발생원 | `07_발생원_계보` | 발생원 계보, NUREG-1465 휘발성군 탐색 |
| 화학형태 | `08_화학형태_거동` | F01–F22 형태별 거동·전처리·시료분배 |
| 시료 | `09_시료매질_교차` | 시료-핵종-화학형태 교차 탐색 |
| 통합 판단 | `10_통합매트릭스` | 검출기 × 에너지대역 × 발생원 적합도 |
| 계산 | `11_역추적계산기` | 에너지 후보, 두 선 분리, 반감기 계산 |
| 근거 | `12_참고문헌` | 46개 참고문헌 검색·URL 열기 |
| 무손실 보기 | 전체 13시트 | 원본 셀 내용을 그대로 볼 수 있는 Workbook Browser |

### 데이터 규모

- 감마선 라인: **183개**
- 감마선 에너지 범위: 약 **26.34–2754.01 keV**
- 발생원 계열: **12개**
- 검출기: **5종**
- 화학형태: **F01–F22 (22개)**
- 참고문헌: **46개**
- 원본 시트: **13개**

> 원본 README의 “감마핵종 116종”과 MASTER의 표시 문자열 고유값 수는 다를 수 있다. 예: `Pb-210`과 `Pb-210 (NORM)`처럼 동일 핵종이 맥락별 표시명으로 중복될 수 있으므로 웹 UI에서는 “라인 수”와 “표시 핵종명 수”를 구분한다.

---

## 3. UX / 정보구조

### 3.1 좌측 전역 내비게이션

1. **Overview** — 전체 데이터 현황, 빠른 시작
2. **Energy Finder** — 관측 에너지 기반 역추적
3. **Nuclide Library** — MASTER 전 라인 탐색
4. **Detector Lab** — 검출기 에너지창/FWHM/분리도
5. **Energy Bands** — 20–100 / 100–600 / 600–1500 / ≥1500 keV
6. **Origins** — 발생원 계보 및 사고 휘발성군
7. **Chemical Forms** — F01–F22
8. **Sample Matrix** — 시료매질 교차
9. **Integration Matrix** — 검출기 × 대역 × 발생원
10. **Half-life Lab** — 2회 계측 기반 실효 반감기
11. **References** — 46개 문헌
12. **Workbook Browser** — 13개 시트 원본 보기

### 3.2 전역 상단 바

- 전역 검색 (`Ctrl/Cmd + K`, `/`)
- Light / Dark 테마 토글
- 전체 화면 대응
- 데이터 출처/버전 표시
- 잠금 버튼

### 3.3 디자인 방향

- 전문 분석 도구의 인상을 주는 **저채도 뉴트럴 + 청록/청색 포인트**
- 과도한 그라디언트, 네온, 장식 애니메이션 배제
- 수치/에너지/핵종은 tabular-number 및 monospace 계열 보조
- 핵심 경고는 색뿐 아니라 아이콘·문구로 중복 표현
- 표는 sticky header, zebra 최소화, hover focus, 좁은 화면에서 수평 스크롤
- Light/Dark는 CSS custom properties로 동일 계층 구조 유지

---

## 4. 주요 동적 기능

### 4.1 Energy Finder

입력:
- 관측 에너지 `E_obs` (keV)
- 허용오차 `±ΔE`
- 선택 검출기(선택)
- 발생원/에너지대역 필터(선택)

계산:

`distance = |E_library - E_obs|`

- MASTER 183라인 전체에서 `distance` 오름차순 정렬
- 기본 Top 10 표시
- 허용오차 내/외 상태를 별도 배지 표시
- 선택 검출기의 실용 에너지범위 밖이면 경고
- 해당 후보의 다중선 확인을 위해 같은 핵종의 다른 라인을 즉시 펼쳐 보기

### 4.2 Nuclide Library

- 핵종/에너지/발생원/화학형태/시료/비고 통합 검색
- 발생원, 에너지대역, 최적검출기, 적합도 필터
- 에너지/핵종/Iγ/반감기 정렬
- 행 클릭 상세 drawer
- 선택 결과 CSV 내보내기
- 행 복사
- 즐겨찾기(localStorage)

### 4.3 Detector Lab

원본 모델:

`FWHM(E) = sqrt(a + bE)`

원본 11번 시트의 계수:

| 검출기 | a | b |
|---|---:|---:|
| HPGe 동축형 p형 | 0.75 | 0.0021 |
| HPGe 평면/광에너지형 | 0.14 | 0.0020 |
| NaI(Tl) 3×3 | 4.0 | 3.2 |
| LaBr3(Ce) | 1.2 | 0.55 |
| CZT | 0.6 | 0.3 |

두 감마선 분리 지표:

`R = |E1-E2| / FWHM(E_mean)`

- `R ≥ 1`: 분리 가능
- `0.5 < R < 1`: 부분 중첩, 다중선 fitting 필요
- `R ≤ 0.5`: 단일 봉우리로 합쳐질 가능성 큼

### 4.4 Half-life Lab

두 시점 순계수로 실효 반감기 추정:

`T_1/2 = Δt × ln(2) / ln(N1/N2)`

검증:
- `N1 > N2 > 0`일 때 정상 계산
- `N2 ≥ N1`이면 단순 방사성 붕괴 단독 가정에 맞지 않는다는 경고
- 입력 단위는 시간/일 등 사용자가 정의하며 출력은 같은 단위

### 4.5 Workbook Browser

전문 화면에서 구조화하지 못한 설명문·주석·보조표까지 누락하지 않도록 모든 13개 시트를 원본 셀 행렬로 제공한다.

- 시트 선택
- 셀 문자열 검색
- 공백 행 축약 On/Off
- CSV 저장
- 원본 행/열 좌표 표시

---

## 5. 접근 제어 및 데이터 보호 설계

### 5.1 GitHub Pages의 제약

GitHub Pages는 기본적으로 HTML/CSS/JavaScript를 제공하는 **정적 호스팅**이다. 일반적인 공개 Pages에서 서버 측 로그인 세션이나 서버 비밀번호 검증을 구현할 수 없다.

따라서 다음 두 수준을 구분한다.

#### A. 단순 JavaScript 비밀번호 게이트 — 사용하지 않음

```js
if (password === "<hardcoded-password>") { ... }
```

이 방식은 브라우저 소스에서 비밀번호가 그대로 노출되며 데이터 파일 URL도 직접 접근 가능하므로 **보안 기능이 아니다**.

#### B. 본 구현 — 암호화된 데이터 payload

- 원본 Excel/평문 JSON을 배포 폴더에 넣지 않음
- 모든 데이터는 `AES-256-GCM`으로 암호화
- 키는 입력 비밀번호에서 `PBKDF2-HMAC-SHA-256`으로 유도
- 무작위 salt + IV 사용
- 브라우저 Web Crypto API로 복호화
- 비밀번호는 JS 코드에 저장하지 않음
- 잘못된 비밀번호는 GCM 인증 실패로 거부
- 복호화된 데이터는 메모리에만 유지

**중요:** 짧은 초기 비밀번호는 사전공격에 약하다. 암호화 구조가 정상이어도 정적 ciphertext를 내려받아 오프라인 대입공격을 할 수 있으므로 실제 사내/연구용 배포에서는 14–20자 이상의 긴 passphrase로 재암호화를 권장한다.

### 5.2 더 강한 접근제어가 필요한 경우

- 조직이 GitHub Enterprise Cloud를 사용한다면 GitHub Pages의 private publishing/access control 검토
- 또는 Cloudflare Access, Netlify Identity/Edge, 사내 reverse proxy, VPN 등 서버 측 인증 계층 사용

---

## 6. 데이터 보존 정책

1. Excel 원본의 각 사용범위를 2차원 배열로 변환
2. `null` 빈 셀 포함, 행/열 구조 유지
3. 모든 전문 기능은 이 원본 행렬에서 파생
4. 원본 설명문은 Workbook Browser에서 항상 접근 가능
5. 계산기 수식은 웹에서 독립 구현하되 Excel의 개념/계수/설명은 그대로 보존
6. 규제 판단이나 공식 분석 결과로 오해하지 않도록 고정 경고 표시

---

## 7. 기술 아키텍처

### 7.1 런타임

- HTML5
- CSS3 Custom Properties
- Vanilla JavaScript ES Modules
- Web Crypto API
- Service Worker (앱 shell 캐시)
- LocalStorage (테마/즐겨찾기/표시환경만 저장)
- 외부 CDN/프레임워크 없음

### 7.2 디렉터리

```text
NatureSpectrumLibrary/
├─ site/                       # GitHub Pages에 실제 배포되는 폴더
│  ├─ index.html
│  ├─ 404.html
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ .nojekyll
│  └─ assets/
│     ├─ css/styles.css
│     ├─ js/app.js
│     └─ data/library.enc.json # 암호화 payload만 배포
├─ docs/
│  ├─ NatureSpectrumLibrary_DESIGN_SPEC.md
│  ├─ USER_GUIDE.md
│  ├─ DEPLOY_GITHUB_PAGES.md
│  └─ SECURITY.md
├─ tools/
│  ├─ xlsx_to_json.py          # Python 표준라이브러리 기반 XLSX 추출기
│  └─ encrypt_dataset.mjs      # Node.js WebCrypto 암호화
├─ .github/workflows/pages.yml
├─ .gitignore
└─ README.md
```

---

## 8. 테마

### Light
- 배경: warm white / neutral gray
- 본문: near-black
- 카드: white + subtle border
- 포인트: teal/blue

### Dark
- 배경: charcoal/navy-neutral
- 본문: cool white
- 카드: elevated dark neutral
- 포인트: cyan/teal 저채도

테마는 `data-theme="light|dark"`로 동작하며 localStorage에 사용자의 선택을 저장한다.

---

## 9. 접근성·사용성

- 모든 인터랙션 키보드 접근 가능
- focus-visible 명확화
- `aria-label`, `aria-live` 사용
- 색상만으로 판정하지 않음
- 모션 감소 선호(`prefers-reduced-motion`) 지원
- 모바일: 사이드바 drawer 전환
- Table: 작은 화면에서 수평 스크롤
- URL hash로 화면 상태 공유 가능 (`#energy`, `#detectors`, ...)

---

## 10. 성능

현재 평문 데이터가 수백 KB 이하이므로 별도 DB 없이 메모리 처리 가능하다.

- 초기에는 HTML/CSS/JS shell만 표시
- 로그인 성공 후에만 데이터 JSON parse
- 표 렌더링은 페이지당 50행 기본, 필요 시 pagination
- 검색은 183개 MASTER 행 수준에서는 브라우저 즉시 처리
- 외부 프레임워크가 없어 GitHub Pages cold load가 작음

---

## 11. 배포 방식

GitHub 공식 Pages Actions 흐름을 따른다.

- `actions/checkout@v6`
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`
- 업로드 경로는 **`site/`만** 지정하여 원본 변환 도구와 문서를 웹에 노출하지 않음

---

## 12. 데이터 갱신 절차

1. 새 Excel을 로컬 PC에 저장
2. `python tools/xlsx_to_json.py input.xlsx data.raw.json`
3. 강한 passphrase 사용 권장:
   - Windows PowerShell: `$env:NSL_PASSWORD="..."`
   - macOS/Linux: `export NSL_PASSWORD='...'`
4. `node tools/encrypt_dataset.mjs data.raw.json site/assets/data/library.enc.json`
5. 평문 `data.raw.json` 삭제 (`.gitignore`에도 포함)
6. Git push → GitHub Actions → Pages 배포

현재 제공본은 사용자가 지정한 초기 비밀번호로 이미 암호화되어 있다. 비밀번호 값 자체는 저장소 파일에 기록하지 않는다.

---

## 13. 검증 체크리스트

- [x] 13개 시트 전부 payload 포함
- [x] MASTER 183 에너지 라인 제공
- [x] 에너지 역추적 Top 10
- [x] 허용오차 판정
- [x] 검출기 FWHM 및 2선 분리 계산
- [x] 반감기 계산
- [x] 발생원/화학형태/시료/통합매트릭스 전문 화면
- [x] 참고문헌 URL 제공
- [x] 원본 Workbook Browser
- [x] Light/Dark 모드
- [x] 모바일/키보드 접근
- [x] CSV 내보내기
- [x] 즐겨찾기
- [x] AES-GCM 암호화 데이터 게이트
- [x] GitHub Pages Actions 배포 파일

---

## 14. 운영상 중요한 한계

- 본 사이트는 원본 워크북과 동일하게 **교육·훈련·연구 목적**이다.
- 감마에너지, 방출확률, 반감기, 검출기 규격은 실제 분석 전 최신 공인 핵데이터 및 실측 교정값으로 재확인해야 한다.
- 에너지 일치만으로 핵종을 확정하지 않는다. 다중선, 반감기, 시료 맥락, 발생원 타당성을 함께 평가해야 한다.
- GitHub Pages 일반 공개 배포는 서버 인증이 아니다. 본 구현의 암호화 payload는 평문 노출을 줄이지만 약한 passphrase 자체의 위험을 제거하지 못한다.

---

## 15. 참고

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Pages private visibility (Enterprise Cloud): https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site
