# NatureSpectrumLibrary 사용자 가이드

## 시작

1. 웹사이트를 엽니다.
2. 사용자에게 별도로 전달된 초기 비밀번호를 입력합니다.
3. 데이터 복호화가 성공하면 Overview가 표시됩니다.

> 초기 비밀번호가 짧다면 실제 배포 전 더 긴 passphrase로 재암호화하는 것을 권장합니다.

## 가장 권장하는 사용 순서

1. **Energy Finder**: 관측 에너지와 허용오차 입력
2. 후보 행 클릭 → 해당 핵종의 다른 감마선 확인
3. **Origins**: 발생원 맥락 확인
4. **Chemical Forms**: 화학형태와 시료 분배·전처리 확인
5. **Sample Matrix**: 실제 시료에서의 타당성 확인
6. **Detector Lab**: 장비 분해능으로 두 선이 실제 분리 가능한지 검토
7. 시간 변화가 있으면 **Half-life Lab** 사용
8. **References** 및 최신 핵데이터로 최종 재검증

## 편의 기능

- `Ctrl/Cmd + K`: 전역 검색
- `/`: 검색창 포커스
- `Esc`: 상세 패널 닫기
- Light/Dark 테마 저장
- MASTER 행 즐겨찾기(localStorage)
- 필터 결과 CSV 저장
- Workbook Browser에서 13개 시트 원본 셀 보기

## 로컬 실행

보안 정책상 `file://`로 직접 열지 말고 간단한 HTTP 서버를 사용하십시오.

```bash
python -m http.server 8000 -d site
```

브라우저에서 `http://localhost:8000`을 엽니다.


## Decay Lab — 여러 핵종의 시간 감쇄 비교

1. 좌측 메뉴에서 **Decay Lab**을 연다.
2. `Nuclide selection`의 **Origins**에서 핵분열 생성물, 중성자 활성화, 부식·마모 활성화(CRUD), 의료 이용, 산업 선원, 천연계열, NORM/TENORM 등 원본 발생원 분류를 빠르게 선택한다. 여러 Origin을 동시에 선택할 수 있다.
3. **Half-life group**에서 반감기 범위를 선택한다.
   - **단반감기 · h**: `T½ < 1 d` — 초/분/시간 규모 포함
   - **중반감기 · d**: `1 d ≤ T½ < 1 y` — 일/주/월 규모 포함
   - **장반감기 · y**: `T½ ≥ 1 y`
4. Origin과 반감기 필터는 **AND**, 같은 그룹 안의 복수 선택은 **OR**로 동작한다. 예를 들어 `핵분열 생성물 + CRUD`와 `단반감기 + 중반감기`를 선택하면 두 Origin 중 하나이면서 두 반감기 그룹 중 하나인 핵종만 표시된다.
5. 검색창을 추가로 사용하면 현재 필터 결과 안에서 핵종명·반감기·Origin을 다시 좁힐 수 있다.
6. **Select filtered**는 현재 조건의 핵종을 한 번에 차트에 추가하고, **Clear filtered**는 현재 조건에 해당하는 선택 핵종만 제거한다. **Reset filters**는 선택 핵종은 유지하고 필터 조건만 초기화한다.
7. 핵종을 개별 체크/해제하는 기존 방식도 그대로 사용할 수 있다. 기본 예시는 I-131, Cs-137, Co-60이다.
8. 각 핵종의 초기 방사능 `A0`를 입력한다. 기본 단위는 **mCi**이다.
9. 시간 단위는 기본 **d(day)**이며 s/min/h/d/wk/mo/y로 바꿀 수 있다.
10. 기본 차트는 **X = Time (d) · linear**, **Y = Activity (mCi) · linear**이다. 필요하면 **Swap axes**로 축을 교환한다.
11. X축과 Y축을 각각 **Linear / Log**로 독립 전환할 수 있고 `Absolute activity`와 `A/A0 (%)`를 선택할 수 있다.
12. `Auto: 8 × shortest T½`를 누르면 선택 핵종 중 가장 짧은 반감기를 기준으로 관찰 구간을 자동 설정한다.
13. Readout time에서 각 핵종의 방사능과 잔존율을 비교하고 **Export time series**로 전체 시계열을 CSV로 저장할 수 있다.

> Decay Lab은 물리적 반감기에 따른 단일 지수 붕괴를 비교하는 도구다. 내부피폭 평가의 생물학적/유효 반감기나 붕괴사슬 ingrowth는 자동 포함하지 않는다.
