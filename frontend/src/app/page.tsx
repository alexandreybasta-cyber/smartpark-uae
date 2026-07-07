import { AgenticHero, AgenticConcept, UseCases, AppShowcase } from '@/components/agentic';
import {
  EnforceNavbar,
  ConceptSteps,
  SweepComparison,
  AgentPoliceDemo,
  SystemSchema,
  EnforceFooter,
} from '@/components/enforce';

// SpotSense — agentic IoT for parking. Light theme matching the native iOS
// app branding (white / orange #F97316). Narrative: agentic IoT concept,
// the two use cases, the real app, then the enforcement deep dive.
export default function Home() {
  return (
    <main className="scroll-smooth" style={{ backgroundColor: '#ffffff' }}>
      <EnforceNavbar />
      <AgenticHero />
      <AgenticConcept />
      <UseCases />
      <AppShowcase />
      <ConceptSteps />
      <SweepComparison />
      <AgentPoliceDemo />
      <SystemSchema />
      <EnforceFooter />
    </main>
  );
}
