import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Footer() {
  return (
    <footer className="z-0 relative bg-slate-800 text-gray-400 px-6 py-6 text-sm">
      <div className="flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="mb-2 md:mb-0">© 2025 Eottabom's Lab. All rights reserved.</div>
        <div className="flex items-center space-x-6">
          <a
              href="mailto:snoopy12oyk@gmail.com"
              className="flex items-center gap-2 hover:text-white transition"
          >
            <i className="fas fa-envelope text-base" aria-hidden="true"/>
            <span>Email</span>
          </a>
          <a
              href="https://github.com/eottabom"
              className="flex items-center gap-2 hover:text-white transition"
          >
            <i className="fab fa-github text-base" aria-hidden="true"/>
            <span>GitHub</span>
          </a>
          <a
              href="/feed.xml"
              className="flex items-center gap-2 hover:text-white transition"
              target="_blank"
              rel="noopener noreferrer"
          >
            <i className="fas fa-rss text-base" aria-hidden="true"/>
            <span>RSS</span>
          </a>

        </div>
      </div>
    </footer>
  );
}
