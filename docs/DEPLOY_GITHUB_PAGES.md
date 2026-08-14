# GitHub Pages 배포

## 1. 저장소 만들기

GitHub에서 `NatureSpectrumLibrary` 저장소를 만든 뒤 이 프로젝트 전체를 push합니다.

```bash
git init
git add .
git commit -m "Initial NatureSpectrumLibrary"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## 2. Pages를 GitHub Actions로 설정

저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 사용합니다.

프로젝트에 포함된 `.github/workflows/pages.yml`이 `site/` 폴더만 배포합니다.

## 3. 보안 확인

GitHub에 push하기 전 다음 파일이 저장소에 없는지 확인하십시오.

- 원본 `.xlsx`
- `data.raw.json`
- 비밀번호가 적힌 `.env`

배포에 필요한 데이터는 `site/assets/data/library.enc.json` 하나입니다.

## 4. 비밀번호 변경 후 배포

새 Excel을 JSON으로 변환하고 원하는 passphrase로 재암호화한 뒤 `library.enc.json`만 commit합니다.

## 5. GitHub Pages 자체 비공개 접근

GitHub 공식 문서 기준, 조직이 GitHub Enterprise Cloud를 사용할 경우 private Pages publishing/access control을 사용할 수 있습니다. 일반 공개 GitHub Pages에서는 본 프로젝트의 암호화 데이터 게이트를 보조 수단으로 사용합니다.
