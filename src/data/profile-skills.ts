export type SkillCategory =
  | 'orchestration'
  | 'delivery'
  | 'cloud'
  | 'security'
  | 'observability'
  | 'data'

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  /** 0–100 operating depth. Drives visual weighting only. */
  depth: number
  years: number
  /** What this looks like in production, in one line. */
  proof: string
  /** ids of adjacent skills — drives the constellation edges */
  linked: string[]
}

export const categoryMeta: Record<SkillCategory, { label: string; color: string; blurb: string }> = {
  orchestration: { label: 'Orchestration', color: '#5ce1ff', blurb: 'Where workloads live and how they survive.' },
  delivery: { label: 'Delivery', color: '#ff5a3c', blurb: 'Getting a commit to production without heroics.' },
  cloud: { label: 'Cloud', color: '#4dffa0', blurb: 'The substrate underneath everything else.' },
  security: { label: 'Security', color: '#ffb545', blurb: 'Gates that fail closed. Secrets that never touch disk.' },
  observability: { label: 'Observability', color: '#a682ff', blurb: 'Knowing what broke before anyone reports it.' },
  data: { label: 'Data & Runtime', color: '#ff7fb0', blurb: 'Stateful things that make deployments interesting.' },
}

export const skills: Skill[] = [
  { id: 'openshift', name: 'Red Hat OpenShift', category: 'orchestration', depth: 92, years: 3, proof: '50+ independently deployable microservices in a regulated banking estate.', linked: ['kubernetes', 'helm', 'argocd'] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'orchestration', depth: 90, years: 3, proof: 'Rollouts, probes, resource shaping, namespace strategy, controlled promotion.', linked: ['helm', 'docker', 'argocd', 'prometheus'] },
  { id: 'helm', name: 'Helm', category: 'orchestration', depth: 88, years: 3, proof: 'Parameterised chart library standardising deployment config across environments.', linked: ['argocd', 'gitlab'] },
  { id: 'docker', name: 'Docker', category: 'orchestration', depth: 86, years: 4, proof: 'Reproducible multi-stage images, layer hygiene, per-service build pipelines.', linked: ['trivy', 'nexus'] },
  { id: 'gitlab', name: 'GitLab CI/CD', category: 'delivery', depth: 93, years: 3, proof: '20+ stage release workflow: artifacts, scans, images, certs, migrations, promotion.', linked: ['jenkins', 'argocd', 'sonarqube', 'vault'] },
  { id: 'argocd', name: 'Argo CD', category: 'delivery', depth: 82, years: 2, proof: 'GitOps reconciliation so cluster state is a reviewable artifact, not a memory.', linked: ['kubernetes', 'terraform'] },
  { id: 'jenkins', name: 'Jenkins', category: 'delivery', depth: 74, years: 3, proof: 'Legacy pipeline maintenance and migration paths onto modern runners.', linked: ['gitlab'] },
  { id: 'terraform', name: 'Terraform', category: 'cloud', depth: 80, years: 2, proof: 'Declarative EKS/ECR/ALB estates with reviewable, repeatable change.', linked: ['aws', 'argocd'] },
  { id: 'aws', name: 'AWS', category: 'cloud', depth: 82, years: 3, proof: 'EKS, ECR, ALB, IAM boundaries and cost-aware sizing on personal platform work.', linked: ['terraform', 'kubernetes'] },
  { id: 'azure', name: 'Azure', category: 'cloud', depth: 76, years: 2, proof: 'AZ-104 certified. VM estate operations, backup and disaster-recovery drills.', linked: ['terraform', 'linux'] },
  { id: 'linux', name: 'Linux', category: 'cloud', depth: 84, years: 4, proof: 'The layer every other tool here eventually bottoms out into.', linked: ['docker', 'aws'] },
  { id: 'vault', name: 'HashiCorp Vault', category: 'security', depth: 78, years: 2, proof: 'Secret material kept out of images, repositories and pipeline logs.', linked: ['gitlab', 'openshift'] },
  { id: 'sonarqube', name: 'SonarQube', category: 'security', depth: 80, years: 3, proof: 'Quality gates wired as blocking stages, not advisory dashboards.', linked: ['veracode', 'gitlab'] },
  { id: 'veracode', name: 'Veracode', category: 'security', depth: 72, years: 2, proof: 'SAST findings triaged and driven to closure before promotion windows.', linked: ['sonarqube'] },
  { id: 'trivy', name: 'Trivy', category: 'security', depth: 76, years: 2, proof: 'Image scanning that fails the build, not a report nobody reads.', linked: ['docker', 'nexus'] },
  { id: 'nexus', name: 'Nexus', category: 'security', depth: 70, years: 3, proof: 'Artifact custody and promotion boundaries between environments.', linked: ['docker'] },
  { id: 'prometheus', name: 'Prometheus', category: 'observability', depth: 80, years: 3, proof: 'Golden-signal alerting tuned to page on customer-visible failure only.', linked: ['grafana', 'kubernetes'] },
  { id: 'grafana', name: 'Grafana', category: 'observability', depth: 82, years: 3, proof: 'Release-window dashboards used live during promotion and rollback calls.', linked: ['prometheus', 'elk'] },
  { id: 'elk', name: 'ELK', category: 'observability', depth: 76, years: 3, proof: 'Correlated log search across service boundaries during incident triage.', linked: ['grafana', 'appdynamics'] },
  { id: 'appdynamics', name: 'AppDynamics', category: 'observability', depth: 70, years: 2, proof: 'Transaction traces separating slow code from slow infrastructure.', linked: ['elk'] },
  { id: 'observe', name: 'Observe', category: 'observability', depth: 64, years: 1, proof: 'Unified telemetry exploration for cross-signal incident correlation.', linked: ['grafana'] },
  { id: 'postgres', name: 'PostgreSQL', category: 'data', depth: 72, years: 3, proof: 'Versioned migrations executed as a gated stage inside the release workflow.', linked: ['gitlab'] },
  { id: 'kafka', name: 'Kafka', category: 'data', depth: 66, years: 2, proof: 'Event-driven service boundaries; consumer lag treated as a deploy signal.', linked: ['prometheus'] },
  { id: 'java', name: 'Java Runtime', category: 'data', depth: 70, years: 3, proof: 'JDK modernisation across services without breaking the release train.', linked: ['docker'] },
]
