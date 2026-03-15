'use client';

import GiscusComponent from '@giscus/react';

export default function Giscus() {
  return (
    <div className="mt-8 lg:mt-16">
      <GiscusComponent
        repo="eottabom/eottabom.github.io"
        repoId="MDEwOlJlcG9zaXRvcnkyNTg4MzEyMzI="
        category="Announcements"
        categoryId="DIC_kwDOD21zgM4C4bTF"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme="noborder_light"
        lang="ko"
        loading="lazy"
      />
    </div>
  );
}
