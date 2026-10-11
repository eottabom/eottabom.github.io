import { useState, type ComponentType } from 'react';
import { Monitor } from 'lucide-react';

// 시뮬레이터처럼 넓은 화면을 전제로 만든 컴포넌트를 모바일에서는 안내 카드로 대신 보여준다.
// 화면 폭 판단은 CSS(md 브레이크포인트)로 해서 서버 렌더링과 결과가 어긋나지 않는다.
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [forceShow, setForceShow] = useState(false);

  return (
    <>
      {!forceShow && (
        <div className="not-prose my-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:hidden">
          <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          <div className="text-sm leading-6 text-slate-600">
            <div className="font-semibold text-slate-800">이 시뮬레이터는 PC 화면에 맞춰져 있어요</div>
            <div>넓은 화면에서 보면 직접 조작하면서 확인할 수 있습니다.</div>
            <button
              type="button"
              onClick={() => setForceShow(true)}
              className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              그래도 보기
            </button>
          </div>
        </div>
      )}
      <div className={forceShow ? '' : 'hidden md:block'}>{children}</div>
    </>
  );
}

export function desktopOnly<P extends object>(Component: ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <DesktopOnly>
        <Component {...props} />
      </DesktopOnly>
    );
  }
  Wrapped.displayName = `DesktopOnly(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
