import { skills } from './profile-skills'
import { projects } from './profile-projects'

export const profile = {
  name: 'Akansh Mowar',
  handle: 'akansh',
  role: 'DevOps / Platform / Cloud Engineer',
  location: 'Pune, India',
  tagline: 'I make software delivery boring on purpose.',
  summary:
    'Builds and operates cloud-native delivery systems that move software from code to production reliably, securely and repeatedly. Currently doing it inside a regulated bank, where a bad release is not a retro item.',
  availability: 'Open to platform, DevOps, SRE and cloud infrastructure roles · remote or hybrid',
  experience: [
    {
      company: 'Barclays',
      role: 'DevOps Engineer',
      period: 'Jul 2023 — Present',
      bullets: [
        'Supports release delivery for an enterprise banking platform of 50+ independently deployable microservices on Red Hat OpenShift.',
        'Maintains a 20+ stage GitLab CI/CD release workflow spanning artifacts, scans, images, certificates, database migrations, Helm deployment and controlled promotion.',
        'Standardises container workloads and deployment configuration across OpenShift using Helm, health probes and parameterised environment values.',
        'Works across shift-left security, secret management, Java runtime modernisation and production observability.',
      ],
    },
    {
      company: 'CloudNXT',
      role: 'Cloud Engineer Intern',
      period: 'May 2022 — Aug 2022',
      bullets: [
        'Monitored Azure virtual machines, supported disaster-recovery drills, backups, provisioning, configuration and patching.',
      ],
    },
  ],
  stack: skills.map((s) => s.name),
  certifications: [
    'Microsoft Azure Administrator — AZ-104',
    'Microsoft Azure Fundamentals — AZ-900',
    'AWS Cloud Practitioner',
  ],
  systems: projects.map((p) => ({ title: p.title, copy: p.copy })),
  links: {
    github: 'https://github.com/akansh23-cloud',
    linkedin: 'https://linkedin.com/in/akansh-mowar-5a83261a0',
    email: 'mailto:mowar23akansh@gmail.com',
    emailPlain: 'mowar23akansh@gmail.com',
    resume: '/Akansh_Mowar_Resume_DevOps.pdf',
  },
}

/** Auto-brief: a 70-second guided flyover for people with no time. */
export interface BriefBeat {
  at: number
  cue: string
  line: string
  focus: 'identity' | 'work' | 'scale' | 'stack' | 'proof' | 'close'
}

export const briefScript: BriefBeat[] = [
  { at: 0, cue: 'IDENTITY', line: 'Akansh Mowar. DevOps, Platform and Cloud engineer, based in Pune.', focus: 'identity' },
  { at: 6, cue: 'CURRENT ROLE', line: 'Three years at Barclays running release delivery for a regulated banking platform.', focus: 'work' },
  { at: 13, cue: 'SCALE', line: 'Fifty-plus independently deployable microservices on Red Hat OpenShift.', focus: 'scale' },
  { at: 20, cue: 'THE PIPELINE', line: 'A twenty-plus stage GitLab release workflow: build, scan, image, certificates, migrations, Helm, promotion.', focus: 'work' },
  { at: 30, cue: 'SECURITY POSTURE', line: 'Gates that block, not advise. Vault for secrets. Trivy, SonarQube and Veracode inside the path.', focus: 'stack' },
  { at: 38, cue: 'PRODUCTION', line: 'Prometheus, Grafana, ELK and AppDynamics — used live during release windows, not configured once and forgotten.', focus: 'stack' },
  { at: 46, cue: 'BUILT ALONE', line: 'Outside work: a Terraform and Argo CD migration assurance platform, and a sixteen-service monolith extraction with zero downtime.', focus: 'proof' },
  { at: 56, cue: 'CREDENTIALS', line: 'Azure Administrator AZ-104, Azure Fundamentals, AWS Cloud Practitioner.', focus: 'proof' },
  { at: 63, cue: 'THE ASK', line: 'Looking for platform, SRE and cloud infrastructure work. Resume and contact are one tap away.', focus: 'close' },
  { at: 71, cue: 'END OF BRIEF', line: 'That is the whole pitch. Everything else here is optional.', focus: 'close' },
]
