// MDX 본문의 표를 가로 스크롤 영역으로 감싼다. 좁은 화면에서 열이 잘리지 않고 좌우로 스크롤된다.
export function MdxTable(props: any) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}
