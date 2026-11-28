import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProjectScreenshot } from "../lib/projects";

// 스크린샷을 좌우로 넘기는 슬라이드. 손가락으로 밀거나(scroll-snap), 양옆 버튼과 아래 점으로 넘긴다.
// 자동으로 넘어가되, 마우스를 올리거나 키보드로 들어오면 멈추고, 동작 줄이기 설정이면 처음부터 멈춘다.

const AUTO_PLAY_MS = 5000;

export default function ScreenshotCarousel({ screenshots }: { screenshots: ProjectScreenshot[] }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    // 확대 보기로 연 장의 번호. 닫혀 있으면 null 이다.
    const [zoomed, setZoomed] = useState<number | null>(null);
    const count = screenshots.length;

    // 확대 보기에서는 Esc 로 닫고 좌우 화살표로 넘기며, 뒤 페이지는 스크롤되지 않게 막는다.
    useEffect(() => {
        if (zoomed === null) {
            return undefined;
        }
        const handleKey = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                setZoomed(null);
            } else if (event.key === "ArrowRight") {
                setZoomed((index) => (index === null ? index : (index + 1) % count));
            } else if (event.key === "ArrowLeft") {
                setZoomed((index) => (index === null ? index : (index - 1 + count) % count));
            }
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKey);
        };
    }, [zoomed, count]);

    const goTo = (index: number): void => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        const next = (index + count) % count;
        track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    };

    // 손으로 밀어서 넘긴 경우에도 점 표시가 맞도록, 스크롤 위치로 현재 장을 계산한다.
    const handleScroll = (): void => {
        const track = trackRef.current;
        if (track && track.clientWidth > 0) {
            setCurrent(Math.round(track.scrollLeft / track.clientWidth));
        }
    };

    useEffect(() => {
        if (isPaused || zoomed !== null || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return undefined;
        }
        const timer = window.setInterval(() => goTo(current + 1), AUTO_PLAY_MS);
        return () => window.clearInterval(timer);
        // goTo 는 렌더링마다 새로 만들어지지만 current, count 만 쓰므로 둘만 따라간다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, count, isPaused, zoomed]);

    return (
        <section
            aria-roledescription="carousel"
            aria-label="스크린샷"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
        >
            <div className="flex items-end justify-between">
                {/* 상세 페이지의 다른 섹션 제목과 같은 크기 */}
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Screenshots</h2>
                <p className="text-sm text-gray-500">
                    {current + 1} / {count}
                </p>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <div
                    ref={trackRef}
                    onScroll={handleScroll}
                    className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {screenshots.map((shot, index) => (
                        <figure
                            key={shot.src}
                            className="w-full shrink-0 snap-center"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} / ${count}: ${shot.caption}`}
                        >
                            <button
                                type="button"
                                onClick={() => setZoomed(index)}
                                aria-label={`${shot.caption} 크게 보기`}
                                className="block w-full cursor-zoom-in"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={shot.src}
                                    alt={shot.caption}
                                    className="aspect-[16/10] w-full object-contain"
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </button>
                            <figcaption className="border-t border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700">
                                {shot.caption}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="이전 스크린샷"
                            onClick={() => goTo(current - 1)}
                            className="absolute left-3 top-[42%] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:bg-white hover:text-gray-900"
                        >
                            <ChevronLeft className="h-5 w-5" aria-hidden />
                        </button>
                        <button
                            type="button"
                            aria-label="다음 스크린샷"
                            onClick={() => goTo(current + 1)}
                            className="absolute right-3 top-[42%] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:bg-white hover:text-gray-900"
                        >
                            <ChevronRight className="h-5 w-5" aria-hidden />
                        </button>
                    </>
                )}
            </div>

            {count > 1 && (
                <div className="mt-3 flex justify-center gap-1.5">
                    {screenshots.map((shot, index) => (
                        <button
                            key={shot.src}
                            type="button"
                            aria-label={`${index + 1}번째 스크린샷 보기`}
                            aria-current={index === current}
                            onClick={() => goTo(index)}
                            className={`h-1.5 rounded-full transition-all ${index === current ? "w-6 bg-gray-900" : "w-1.5 bg-gray-300 hover:bg-gray-400"}`}
                        />
                    ))}
                </div>
            )}

            {/* 확대 보기. 새 창 대신 페이지 위에 어둡게 깔고 크게 보여준다. 바깥이나 X 를 누르면 닫힌다. */}
            {zoomed !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${screenshots[zoomed].caption} 확대 보기`}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4 sm:p-8"
                    onClick={() => setZoomed(null)}
                >
                    <button
                        type="button"
                        aria-label="확대 보기 닫기"
                        onClick={() => setZoomed(null)}
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                    {/* 이미지와 캡션을 눌러도 닫히지 않게 클릭이 바깥으로 퍼지지 않도록 막는다. */}
                    <figure className="flex max-h-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={screenshots[zoomed].src}
                            alt={screenshots[zoomed].caption}
                            className="max-h-[80vh] max-w-full rounded-lg bg-white object-contain shadow-2xl"
                        />
                        <figcaption className="mt-3 text-sm text-white/80">
                            {screenshots[zoomed].caption}
                            <span className="ml-2 text-white/50">
                                {zoomed + 1} / {count}
                            </span>
                        </figcaption>
                    </figure>
                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="이전 스크린샷"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setZoomed((zoomed - 1 + count) % count);
                                }}
                                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                            >
                                <ChevronLeft className="h-6 w-6" aria-hidden />
                            </button>
                            <button
                                type="button"
                                aria-label="다음 스크린샷"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setZoomed((zoomed + 1) % count);
                                }}
                                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                            >
                                <ChevronRight className="h-6 w-6" aria-hidden />
                            </button>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
