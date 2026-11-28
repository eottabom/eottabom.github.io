# eottabom.github.io

개인 기술 블로그 프로젝트다.

## 실행 방법

```bash
npm install
npm run dev
```

## 지식 그래프 검증과 개념 분류

```bash
# 지식 그래프 데이터 검증
npm run check:knowledge

# 로컬 Gemma(OpenAI 호환 API)로 글 1편 개념 분류 제안 확인 (파일 미수정)
npm run classify:knowledge -- --article <게시글-id> --dry-run

# 분류 결과를 knowledge/articles.json 에 반영 (merge 정책: append | replace)
npm run classify:knowledge -- --article <게시글-id> --apply --merge append
```
