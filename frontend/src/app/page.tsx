import { AgenticHero, AgenticConcept, UseCases } from '@/components/agentic';
import {
  EnforceNavbar,
  ConceptSteps,
  SweepComparison,
  AgentPoliceDemo,
  SystemSchema,
  EnforceFooter,
} from '@/components/enforce';

// SmartPark — agentic IoT for parking. Narrative order for the hackathon:
// 1. the agentic IoT concept, 2. the two use cases (driver copilot +
// enforcement), 3. the enforcement deep dive and system schema.
export default function Home() {
  return (
    <main className="scroll-smooth" style={{ backgroundColor: '#04060b' }}>
      <EnforceNavbar />
      <AgenticHero />
      <AgenticConcept />
      <UseCases />
      <ConceptSteps />
      <SweepComparison />
      <AgentPoliceDemo />
      <SystemSchema />
      <EnforceFooter />
    </main>
  );
}
