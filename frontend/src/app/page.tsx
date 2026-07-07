import {
  EnforceNavbar,
  EnforceHero,
  ConceptSteps,
  SweepComparison,
  AgentPoliceDemo,
  SystemSchema,
  EnforceFooter,
} from '@/components/enforce';

// SmartPark ENFORCE — parking-compliance platform for RTA & Dubai Police.
// The previous consumer landing lives on in @/components/landing if needed.
export default function Home() {
  return (
    <main className="scroll-smooth" style={{ backgroundColor: '#04060b' }}>
      <EnforceNavbar />
      <EnforceHero />
      <ConceptSteps />
      <SweepComparison />
      <AgentPoliceDemo />
      <SystemSchema />
      <EnforceFooter />
    </main>
  );
}
