export interface Answer {
  id: string
  match: string[]
  question: string
  response: string[]
}

export const answers: Answer[] = [
  {
    id: 'k8s',
    match: ['kubernetes', 'k8s', 'openshift', 'orchestration', 'pods', 'pod', 'cluster', 'clusters', 'container', 'containers', 'helm'],
    question: 'How deep is the Kubernetes / OpenShift experience?',
    response: [
      'Three years operating Red Hat OpenShift in production at Barclays, supporting 50+ independently deployable microservices.',
      'Day to day that means Helm-templated workloads, readiness and liveness probes, parameterised environment values, rolling deployment behaviour and controlled promotion between tiers.',
      'The interesting part is not writing manifests. It is making a fleet of services behave identically so that a rollout is boring.',
    ],
  },
  {
    id: 'cicd',
    match: ['ci', 'cd', 'ci cd', 'cicd', 'pipelines', 'gitlab', 'jenkins', 'release', 'releases', 'deploy', 'deployment', 'build', 'builds', 'argo', 'argocd', 'gitops', 'promotion'],
    question: 'What does the CI/CD ownership actually cover?',
    response: [
      'A 20+ stage GitLab CI/CD release workflow that carries a change from source to production.',
      'Stages span artifact build, quality and security scans, image build and scan, certificate handling, database migrations, Helm deployment and gated promotion.',
      'Jenkins appears for older pipelines and migration paths onto modern runners. Argo CD handles GitOps reconciliation where cluster state should be reviewable in git.',
    ],
  },
  {
    id: 'security',
    match: ['security', 'secure', 'vault', 'secret', 'secrets', 'sast', 'dast', 'scan', 'scanning', 'vulnerability', 'vulnerabilities', 'trivy', 'sonar', 'sonarqube', 'veracode', 'shift left', 'compliance', 'audit', 'pipeline', 'gate', 'gates'],
    question: 'How is security handled in the pipeline?',
    response: [
      'Shift-left and blocking rather than advisory. SonarQube quality gates, Veracode SAST and Trivy image scanning are stages that can fail a release.',
      'Secret material lives in HashiCorp Vault — never in images, repositories or pipeline logs.',
      'Nexus provides artifact custody so promotion between environments has a defined boundary rather than a copy operation.',
    ],
  },
  {
    id: 'incident',
    match: ['incident', 'incidents', 'oncall', 'on call', 'outage', 'outages', 'rollback', 'production', 'degrade', 'degrades', 'degrading', 'down', 'broken', 'observability', 'monitoring', 'alerting', 'grafana', 'prometheus', 'elk', 'logs', 'tracing', 'debug', 'troubleshoot', 'sre'],
    question: 'What happens when production degrades?',
    response: [
      'Correlate first, act second. Prometheus and Grafana for metrics and release-window dashboards, ELK for cross-service log search, AppDynamics and Observe for transaction-level tracing.',
      'For a readiness regression introduced by a release, the fastest safe move is restoring the previous known-good version, then diagnosing without a customer-impact clock running.',
      'Story Mode in this portfolio is a compressed version of exactly that loop.',
    ],
  },
  {
    id: 'cloud',
    match: ['aws', 'azure', 'cloud', 'clouds', 'terraform', 'infrastructure', 'iac', 'eks', 'ecr', 'certification', 'certifications', 'certified', 'az 104', 'az 900'],
    question: 'Which clouds, and how deep?',
    response: [
      'Azure at administrator depth — AZ-104 certified, with hands-on VM estate operations, backups and disaster-recovery drills.',
      'AWS through personal platform work: EKS, ECR and ALB provisioned with Terraform and reconciled with Argo CD. Certified as AWS Cloud Practitioner.',
      'The honest framing: deeper on operations and delivery than on large-scale network architecture.',
    ],
  },
  {
    id: 'projects',
    match: ['project', 'projects', 'side project', 'personal', 'built', 'build outside', 'migration assurance', 'career autopilot', 'github', 'open source', 'portfolio project'],
    question: 'What has been built outside of work?',
    response: [
      'Migration Assurance Platform — an AWS EKS/ECR/ALB estate with Terraform, Argo CD GitOps and GitLab CI/CD, designed so a migration cutover produces evidence rather than a status update.',
      'Career Autopilot — a 16-service extraction from a Node/Express monolith, with per-service Docker builds, monorepo CI/CD and an API-gateway fallback so the product stayed available during migration.',
      'This portfolio: React 19, TypeScript and React Three Fiber, with four playable simulations running on a real-time 3D renderer.',
    ],
  },
  {
    id: 'availability',
    match: ['hire', 'hiring', 'available', 'availability', 'notice', 'relocate', 'relocation', 'location', 'based', 'remote', 'hybrid', 'contact', 'email', 'reach', 'touch', 'get in touch', 'interview', 'salary', 'pune', 'india', 'resume', 'cv'],
    question: 'Location, availability and how to make contact.',
    response: [
      'Based in Pune, India. Open to remote and hybrid platform, DevOps, SRE and cloud infrastructure roles.',
      'Fastest route is email — mowar23akansh@gmail.com — or LinkedIn. Both are one tap away in the Contact panel.',
      'The resume PDF in the Contact panel is the canonical version.',
    ],
  },
  {
    id: 'strength',
    match: ['strength', 'strengths', 'best at', 'good at', 'superpower', 'differentiator', 'why hire', 'why should', 'standout', 'stand out'],
    question: 'What is the strongest part of this profile?',
    response: [
      'Operating delivery where mistakes are expensive and auditable. A regulated banking platform does not let you learn release discipline optionally.',
      'A standardisation reflex — turning a one-off fix into a chart, a template or a gate so nobody repeats the work.',
      'Coverage across the whole path: build, scan, package, deploy, observe, recover. Not one slice of it.',
    ],
  },
  {
    id: 'weakness',
    match: ['weakness', 'weaknesses', 'gap', 'gaps', 'not good', 'learning', 'improve', 'growth', 'missing', 'honest', 'limitation', 'limitations'],
    question: 'Where are the honest gaps?',
    response: [
      'Large-scale cloud network architecture is a growth area — the depth is in operations and delivery, not in designing multi-region topologies from scratch.',
      'Formal SLO and error-budget ownership has been practised through release windows rather than held as a named responsibility.',
      'Service mesh at scale is understood conceptually but has not been owned in production.',
    ],
  },
  {
    id: 'portfolio',
    match: ['this site', 'this portfolio', 'how did you build', 'threejs', 'three js', 'react', 'webgl', 'game', 'games', 'made this', 'website'],
    question: 'How was this portfolio built?',
    response: [
      'React 19, TypeScript, Vite, React Three Fiber and Three.js, with Zustand for state and a custom postprocessing pipeline.',
      'Every visual is generated at runtime — custom GLSL shaders for the holographic ground, instanced meshes for the cluster city, canvas-drawn textures for in-world labels. No downloaded 3D assets.',
      'Four playable simulations share the same renderer: an endless runner, a real-time cluster defence, a terminal triage drill and a root-cause matrix.',
    ],
  },
]
