import {
  Navbar,
  Hero,
  ProblemSection,
  InteractiveDemo,
  AgentSection,
  HardwareSection,
  ArchitectureSection,
  TechStackSection,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="scroll-smooth">
      <Navbar />
      <Hero />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <ProblemSection />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <InteractiveDemo />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <AgentSection />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <HardwareSection />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <ArchitectureSection />
      <div className="h-px bg-white/[0.08] max-w-7xl mx-auto" />
      <TechStackSection />
      <Footer />
    </main>
  );
}
