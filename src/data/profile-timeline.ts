export interface TimelineEntry {
  id: string
  year: string
  period: string
  title: string
  org: string
  kind: 'work' | 'cert' | 'build'
  summary: string
  detail: string[]
}

export const timeline: TimelineEntry[] = [
  {
    id: 'cloudnxt',
    year: '2022',
    period: 'May 2022 — Aug 2022',
    title: 'Cloud Engineer Intern',
    org: 'CloudNXT',
    kind: 'work',
    summary: 'First contact with production: keeping other people’s machines alive.',
    detail: [
      'Monitored an Azure virtual machine estate and responded to health degradation.',
      'Supported disaster-recovery drills, backup verification and restore rehearsals.',
      'Handled provisioning, configuration and patch cycles across environments.',
    ],
  },
  {
    id: 'az900',
    year: '2022',
    period: '2022',
    title: 'Azure Fundamentals — AZ-900',
    org: 'Microsoft',
    kind: 'cert',
    summary: 'Formalised the cloud vocabulary already in daily use.',
    detail: ['Cloud service models, Azure core services, governance and cost fundamentals.'],
  },
  {
    id: 'barclays',
    year: '2023',
    period: 'Jul 2023 — Present',
    title: 'DevOps Engineer',
    org: 'Barclays',
    kind: 'work',
    summary: 'Release delivery for a regulated banking platform, where a bad deploy is a headline.',
    detail: [
      'Supports release delivery for 50+ independently deployable microservices on Red Hat OpenShift.',
      'Maintains a 20+ stage GitLab CI/CD release workflow spanning artifacts, scans, images, certificates, database migrations, Helm deployment and controlled promotion.',
      'Standardises container workloads and deployment configuration using Helm, health probes and parameterised environment values.',
      'Works across shift-left security, secret management, Java runtime modernisation and production observability.',
    ],
  },
  {
    id: 'az104',
    year: '2023',
    period: '2023',
    title: 'Azure Administrator — AZ-104',
    org: 'Microsoft',
    kind: 'cert',
    summary: 'Operations-grade Azure: identity, networking, storage, governance.',
    detail: ['Identity, governance, storage, compute, virtual networking and monitoring at administrator depth.'],
  },
  {
    id: 'awsccp',
    year: '2024',
    period: '2024',
    title: 'AWS Cloud Practitioner',
    org: 'Amazon Web Services',
    kind: 'cert',
    summary: 'Cross-cloud fluency, because platforms rarely stay on one provider.',
    detail: ['AWS service landscape, shared responsibility model, billing and architecture fundamentals.'],
  },
  {
    id: 'map',
    year: '2025',
    period: '2025 — Present',
    title: 'Migration Assurance Platform',
    org: 'Personal build',
    kind: 'build',
    summary: 'Making migration cutovers something you can prove rather than hope about.',
    detail: [
      'AWS EKS/ECR/ALB estate provisioned with Terraform and reconciled through Argo CD GitOps.',
      'Per-service Docker builds driven by GitLab CI/CD with promotion gates between environments.',
      'Built around the idea that a cutover should produce evidence, not just a status update.',
    ],
  },
  {
    id: 'autopilot',
    year: '2025',
    period: '2025 — Present',
    title: 'Career Autopilot — platform migration',
    org: 'Personal build',
    kind: 'build',
    summary: 'A 16-service extraction from a monolith, done incrementally and without downtime.',
    detail: [
      'Extracted 16 services from a Node/Express monolith with per-service container builds.',
      'Monorepo CI/CD with independent deployability and an API-gateway fallback during migration.',
      'Ran the extraction incrementally so the product stayed available throughout.',
    ],
  },
]
