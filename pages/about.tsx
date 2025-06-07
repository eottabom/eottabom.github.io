import Header from '../components/Header';
import Footer from '../components/Footer';
import {Briefcase, GraduationCap, Award, Info, List} from 'lucide-react';
import Link from "next/link";
import { Home } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header isDark={false} />

      {/* Hero Section */}
      <section className="text-center pt-40 pb-28 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">Hi, I’m a <strong>considerate developer</strong>.</h1>
        <p className="text-lg text-gray-600 leading-loose space-y-2">
          I believe being considerate means writing <strong>clean, readable code</strong>,<br />
          building <strong>predictable and testable systems</strong>,<br />
          and delivering <strong>reliable, trustworthy services</strong> that users can depend on.<br /><br />
          I’m constantly <strong>learning and growing</strong> to become better at this,<br />
          and this blog is where I share my <strong>journey as a learning developer</strong>.
        </p>
      </section>

      {/* Content */}
      <main className="flex-grow bg-slate-50 px-4 py-20 pb-32">
        <div className="max-w-4xl mx-auto space-y-24">

          {/* About Summary */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800">
              <Info className="w-5 h-5 text-blue-500" /> About Me
            </h2>
            <div className="text-gray-700 text-[15px] leading-relaxed space-y-4">
              <p>소프트웨어 개발자로서 <strong>CDN, 제조, 게임 산업 분야의 서비스</strong>를 개발해왔어요.</p>
              <p><strong>Clean Code</strong>에 관심이 많고, <strong>레거시 서비스 리팩토링</strong>을 주도하며 개선해왔습니다.</p>
              <p>현재는 <strong>NCSOFT</strong>에서 커뮤니티 플랫폼을 담당하며, <strong>150+ API를 gRPC + Service Mesh</strong> 구조로 운영하고 있어요.</p>
              <p>새로운 기술을 배우는 데 거리낌이 없고, <strong>Deep Dive 분석</strong>을 즐깁니다.</p>
              <p>코드 리뷰, 정적/통합 테스트 자동화 환경에서 일하며, 더 나은 프로세스를 제안합니다.</p>
            </div>
          </section>

          {/* Experience */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800">
              <Briefcase className="w-5 h-5 text-green-600" /> Experience
            </h2>
            <div className="space-y-6 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold">NCSOFT <span className="text-gray-500">(2020.07.06 ~ )</span></h3>
                <ul className="list-disc list-inside mt-1">
                  <li>커뮤니티 플랫폼 백엔드 개발 / 운영</li>
                  <li>인증 플랫폼 백엔드 개발 / 운영</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">HYOSUNG ITX <span className="text-gray-500">(2016.09.05 ~ 2020.06.30)</span></h3>
                <ul className="list-disc list-inside mt-1">
                  <li>스마트 팩토리 백엔드 개발</li>
                  <li>CDN 서비스 개발</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800">
              <GraduationCap className="w-5 h-5 text-indigo-500" /> Education
            </h2>
            <p className="text-sm text-gray-700">연세대학교 공학대학원 (17.09 ~ 20.02)</p>
          </section>

          {/* Awards */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800">
              <Award className="w-5 h-5 text-amber-500" /> Awards
            </h2>
            <div className="space-y-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold">NC 사내 컨퍼런스 발표</h4>
                <p className="text-gray-500">2022.10.30</p>
                <p>About gRPC Transcoder</p>
              </div>
              <div>
                <h4 className="font-semibold">쏘카X정보과학회 AI 영상 분석 경진 대회</h4>
                <p className="text-gray-500">2019.12.20</p>
                <p>장려상 - Parking space recognition solution</p>
              </div>
              <div>
                <h4 className="font-semibold">현대IHL 신사업 아이디어 공모전</h4>
                <p className="text-gray-500">2016.09.23</p>
                <p>우수상 - Real-time signal recognition application</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Link
          href="/"
          className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 rounded-lg shadow-md p-3 hover:shadow-lg transition"
          aria-label="홈으로 가기"
      >
        <Home className="w-6 h-6 text-gray-800"/>
      </Link>

      <Footer />
    </div>
  );
}
