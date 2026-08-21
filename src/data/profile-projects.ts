import type { SkillCategory } from './profile-skills'

export interface ProjectCard {
  id: string
  title: string
  tag: string
  copy: string
  stack: string[]
  signals: { label: string; value: string }[]
}

export const projects: ProjectCard[] = [
  {
    id: 'release',
    title: 'Enterprise Release Engineering',
    tag: 'BARCLAYS · PRODUCTION',
    copy: 'CI/CD, OpenShift and Kubernetes, Helm, security gates, secret material, promotion controls and production readiness across a large regulated platform.',
    stack: ['OpenShift', 'GitLab CI/CD', 'Helm', 'Vault', 'SonarQube', 'Grafana'],
    signals: [
      { label: 'Microservices', value: '50+' },
      { label: 'Pipeline stages', value: '20+' },
      { label: 'Promotion path', value: 'Dev → Prod' },
    ],
  },
  {
    id: 'map',
    title: 'Migration Assurance Platform',
    tag: 'PERSONAL · PLATFORM',
    copy: 'A DevOps project that makes migration cutovers verifiable and repeatable instead of a one-off spreadsheet exercise.',
    stack: ['AWS EKS', 'ECR', 'ALB', 'Terraform', 'Argo CD', 'GitLab CI/CD'],
    signals: [
      { label: 'Infrastructure', value: 'Terraform' },
      { label: 'Delivery', value: 'GitOps' },
      { label: 'Goal', value: 'Provable cutovers' },
    ],
  },
  {
    id: 'autopilot',
    title: 'Career Autopilot',
    tag: 'PERSONAL · MIGRATION',
    copy: 'A 16-service extraction from a monolith with per-service Docker builds, monorepo CI/CD and an API-gateway fallback during incremental rollout.',
    stack: ['Docker', 'Monorepo CI', 'API Gateway', 'AWS'],
    signals: [
      { label: 'Services extracted', value: '16' },
      { label: 'Downtime', value: 'None' },
      { label: 'Strategy', value: 'Strangler fig' },
    ],
  },
]

export interface RoleArchetype {
  id: string
  label: string
  blurb: string
  weights: Partial<Record<SkillCategory, number>>
  anchors: string[]
  pitch: string
  gap: string
}

export const roleArchetypes: RoleArchetype[] = [
  {
    id: 'devops',
    label: 'DevOps Engineer',
    blurb: 'Owns the path from commit to production.',
    weights: { delivery: 0.38, orchestration: 0.26, security: 0.18, observability: 0.12, cloud: 0.06 },
    anchors: ['gitlab', 'openshift', 'helm', 'vault'],
    pitch: 'This is the day job. A 20+ stage release workflow across 50+ microservices in a regulated bank is the reference implementation.',
    gap: 'Nothing structural. The question is scale of team, not scale of skill.',
  },
  {
    id: 'platform',
    label: 'Platform Engineer',
    blurb: 'Builds the paved road other engineers ship on.',
    weights: { orchestration: 0.34, delivery: 0.28, cloud: 0.18, observability: 0.12, security: 0.08 },
    anchors: ['kubernetes', 'helm', 'argocd', 'terraform'],
    pitch: 'Standardising Helm charts, probes and environment values across a large estate is platform work under a different job title.',
    gap: 'Less experience with internal developer portals and self-service tooling as a product.',
  },
  {
    id: 'sre',
    label: 'Site Reliability Engineer',
    blurb: 'Keeps production honest and recoverable.',
    weights: { observability: 0.34, orchestration: 0.26, delivery: 0.2, cloud: 0.12, data: 0.08 },
    anchors: ['prometheus', 'grafana', 'elk', 'kubernetes'],
    pitch: 'Release windows, rollback calls and live dashboards are already part of the role. The instincts are there.',
    gap: 'Formal SLO and error-budget ownership has been practised, not owned as a named responsibility.',
  },
  {
    id: 'cloud',
    label: 'Cloud Infrastructure Engineer',
    blurb: 'Designs and runs the substrate.',
    weights: { cloud: 0.4, orchestration: 0.22, security: 0.18, delivery: 0.14, observability: 0.06 },
    anchors: ['aws', 'terraform', 'azure', 'linux'],
    pitch: 'AZ-104 plus a self-built Terraform-provisioned EKS estate, run and maintained rather than demoed once.',
    gap: 'Multi-region network architecture at scale is the growth edge — depth is in operations, not topology design.',
  },
]

/** Deterministic knowledge base for the recruiter console. No model calls, nothing invented. */
