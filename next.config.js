const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => ({
  // 개발 서버에서는 글 화면 편집용 API(pages/api/dev-edit.ts)를 쓰기 위해 정적 export 를 끈다.
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: 'export' }),
  trailingSlash: true
});
