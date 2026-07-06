export default function Footer() {
  return (
    <footer className="py-12 px-8 text-center border-t border-white/[0.08]">
      <p className="text-[13px] text-sp-text-3">
        SmartPark UAE — Built for the Qwen Cloud Challenge &middot; EdgeAgent Track 2026
      </p>
      <div className="flex gap-6 justify-center mt-3">
        <a
          href="https://www.qwencloud.com/challenge/hackathon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sp-text-3 no-underline hover:text-sp-cyan transition-colors"
        >
          Hackathon
        </a>
        <a href="#demo" className="text-xs text-sp-text-3 no-underline hover:text-sp-cyan transition-colors">
          Live Demo
        </a>
        <a href="#agents" className="text-xs text-sp-text-3 no-underline hover:text-sp-cyan transition-colors">
          AI Agents
        </a>
        <a href="#architecture" className="text-xs text-sp-text-3 no-underline hover:text-sp-cyan transition-colors">
          Architecture
        </a>
      </div>
    </footer>
  );
}
