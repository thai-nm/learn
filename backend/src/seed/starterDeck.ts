import type { CreateCardInput, CreateDeckInput } from "../domain/repository.js";

/** Owns the shared starter deck so no regular user's email can claim/edit it. */
export const SEED_OWNER_EMAIL = "seed@recall.internal";

export const STARTER_DECK: CreateDeckInput = {
  ownerEmail: SEED_OWNER_EMAIL,
  title: "Azure WAF & Landing Zones Starter",
  description:
    "Foundational cards spanning the Azure Well-Architected Framework pillars " +
    "(weighted toward Reliability and Operational Excellence) plus Landing Zone basics.",
  topics: [
    "Reliability",
    "Operational Excellence",
    "Security",
    "Cost Optimization",
    "Performance Efficiency",
    "Landing Zones",
  ],
  visibility: "shared",
};

/** deckId is filled in by the seed script once the deck is created. */
export const STARTER_CARDS: Omit<CreateCardInput, "deckId">[] = [
  // Reliability
  {
    front: "What's the difference between availability and reliability in WAF terms?",
    back: "Availability is the % of time a system is operational and responsive. Reliability is the broader ability to recover from failures and keep meeting that availability target over time.",
    why: "Availability is a measurement; reliability is the design capability that produces it.",
    topic: "Reliability",
  },
  {
    front: "What's the difference between an Availability Zone and a region pair?",
    back: "An Availability Zone is a physically separate datacenter grouping (power/cooling/network) within one region, protecting against datacenter-level failure. A region pair is two full Azure regions in the same geography, used for cross-region disaster recovery.",
    why: "AZs protect against local failures; region pairs protect against regional disasters.",
    topic: "Reliability",
  },
  {
    front: "What's the difference between RTO and RPO?",
    back: "RTO (Recovery Time Objective) is the max acceptable time to restore service after an outage. RPO (Recovery Point Objective) is the max acceptable data loss, measured in time.",
    why: "These two numbers directly drive the backup/replication strategy you choose (e.g. sync vs. async replication).",
    topic: "Reliability",
  },
  {
    front:
      "Why does the Reliability pillar emphasize designing for failure rather than preventing it?",
    back: "At cloud scale, failures (hardware, network, dependencies) are inevitable. WAF favors resiliency patterns — retries, redundancy, circuit breakers — over assuming 100% dependency uptime.",
    why: "Shifts the design mindset from failure avoidance to failure tolerance.",
    topic: "Reliability",
  },
  {
    front: "What does the Circuit Breaker pattern protect against?",
    back: "Cascading failures — it stops calling a failing downstream dependency for a cooldown period instead of repeatedly retrying and overwhelming it further.",
    why: "Prevents one failing service from taking down its callers too.",
    topic: "Reliability",
  },
  {
    front: "What is an Azure Recovery Services Vault used for?",
    back: "A centralized backup and disaster-recovery target for Azure resources (VMs, SQL, file shares), backing Azure Backup and Azure Site Recovery.",
    why: "The core tool for actually hitting your RPO/RTO targets, not just defining them.",
    topic: "Reliability",
  },

  // Operational Excellence
  {
    front:
      "What is Infrastructure as Code (IaC), and why does Operational Excellence emphasize it?",
    back: "Managing infrastructure through versioned, declarative config (e.g. Bicep, Terraform) instead of manual changes — repeatable, auditable, testable deployments.",
    why: 'Manual "ClickOps" changes cause drift and aren\'t reproducible.',
    topic: "Operational Excellence",
  },
  {
    front: "What's the difference between Bicep and ARM templates?",
    back: "Bicep is a DSL that transpiles to ARM JSON — same deployment engine and capabilities as ARM templates, but with cleaner, more concise syntax.",
    why: "Bicep is Microsoft's recommended authoring layer over raw ARM JSON, not a different deployment engine.",
    topic: "Operational Excellence",
  },
  {
    front: "What role do Azure Monitor and Log Analytics play in operational excellence?",
    back: "Centralized collection of metrics and logs across resources, enabling observability, alerting, and diagnosis.",
    why: "You can't operate what you can't observe.",
    topic: "Operational Excellence",
  },
  {
    front: "What is a blue-green deployment?",
    back: "Running two identical production environments — blue (current) and green (new) — and switching traffic to green after validation, keeping blue as an instant rollback path.",
    why: "Reduces deployment risk and downtime compared to in-place upgrades.",
    topic: "Operational Excellence",
  },
  {
    front: "Why does WAF recommend automating routine operational tasks?",
    back: "Automation reduces human error and ensures consistency, freeing engineers for higher-value work — manual repetitive tasks don't scale and are error-prone.",
    why: "Ties Operational Excellence to the broader DevOps culture goal of reducing toil.",
    topic: "Operational Excellence",
  },
  {
    front: "What's the difference between monitoring and observability?",
    back: "Monitoring watches known metrics/dashboards for known failure modes. Observability is the ability to ask new questions about system state from existing telemetry without shipping new code.",
    why: "Observability supports debugging unknown-unknowns, not just triggering known alerts.",
    topic: "Operational Excellence",
  },

  // Security
  {
    front: 'What does the Zero Trust principle "never trust, always verify" mean?',
    back: "No implicit trust is granted based on network location (e.g. being inside the corporate network) — every request is authenticated and authorized regardless of origin.",
    why: "Replaces perimeter-based trust models, which fail once an attacker is inside the network.",
    topic: "Security",
  },
  {
    front: "What's the difference between Azure RBAC and Azure Policy?",
    back: "RBAC controls WHO can perform WHAT actions on WHICH resources (identity/access). Policy controls WHAT configurations are allowed to exist (compliance/governance), regardless of who created them.",
    why: "RBAC = access control; Policy = configuration guardrails. They solve different problems.",
    topic: "Security",
  },
  {
    front: "What is the principle of least privilege?",
    back: "Granting identities only the minimum permissions needed to do their job, nothing more.",
    why: "Limits the blast radius if credentials are ever compromised.",
    topic: "Security",
  },

  // Cost Optimization
  {
    front: "What's the difference between Reserved Instances and Savings Plans in Azure?",
    back: "Reserved Instances commit to a specific VM SKU/region for 1-3 years for a discount. Savings Plans commit to a $/hour spend across flexible compute services, trading some discount for flexibility.",
    why: "Choose based on how stable vs. flexible the underlying workload's shape is.",
    topic: "Cost Optimization",
  },
  {
    front: "What is the core question behind the Cost Optimization pillar?",
    back: '"Are we getting the maximum value for what we\'re spending?" — not simply minimizing cost, but aligning spend to business value.',
    why: 'Avoids the common misread of this pillar as "always cut costs."',
    topic: "Cost Optimization",
  },
  {
    front: "What role does Azure Advisor play in cost optimization?",
    back: "It analyzes resource usage and gives personalized recommendations for savings — e.g. rightsizing VMs, flagging unused resources.",
    why: "An automated, ongoing cost-hygiene tool rather than a one-time audit.",
    topic: "Cost Optimization",
  },

  // Performance Efficiency
  {
    front: "What's the difference between vertical and horizontal scaling?",
    back: "Vertical scaling (scale up) increases the size/power of a single instance. Horizontal scaling (scale out) adds more instances to distribute load.",
    why: "Horizontal scaling generally gives better resilience and elasticity in cloud-native design.",
    topic: "Performance Efficiency",
  },
  {
    front: "What is autoscaling, and why is it a Performance Efficiency practice?",
    back: "Automatically adjusting compute resources based on demand metrics (CPU, queue length, etc.), matching capacity to actual load instead of static overprovisioning.",
    why: "Balances performance and cost dynamically instead of trading one off permanently for the other.",
    topic: "Performance Efficiency",
  },
  {
    front: "What is the purpose of a CDN in performance efficiency?",
    back: "Caches content at edge locations closer to users, reducing latency and offloading origin servers.",
    why: "Improves perceived performance for geographically distributed users specifically.",
    topic: "Performance Efficiency",
  },

  // Landing Zones
  {
    front: "What is an Azure Landing Zone?",
    back: "A pre-provisioned, governed environment (subscriptions, networking, identity, policy) that provides the foundation for deploying workloads at scale, per Microsoft's Cloud Adoption Framework.",
    why: "Gives new workloads a secure, compliant starting point instead of ad hoc setup each time.",
    topic: "Landing Zones",
  },
  {
    front: "What is the purpose of Management Groups in Azure?",
    back: "Hierarchical containers above subscriptions, used to apply policy and RBAC consistently across multiple subscriptions at scale.",
    why: "Enables org-wide governance without repeating configuration per subscription.",
    topic: "Landing Zones",
  },
  {
    front: "What is the hub-and-spoke network topology?",
    back: 'A central "hub" VNet hosts shared services (firewall, VPN/ExpressRoute gateway, DNS); "spoke" VNets per workload peer to the hub for connectivity and shared security controls.',
    why: "Centralizes shared network/security services and controls egress from one place.",
    topic: "Landing Zones",
  },
  {
    front: 'What is "subscription vending" in a Landing Zone context?',
    back: "An automated, self-service process for provisioning new compliant subscriptions — with baseline policy, networking, and RBAC already applied — without manual platform-team intervention.",
    why: "Scales landing zone governance without the platform team becoming a bottleneck.",
    topic: "Landing Zones",
  },
  {
    front:
      "What's the difference between a platform landing zone and an application/workload landing zone?",
    back: "Platform landing zones host shared services (identity, connectivity, management) used org-wide. Workload landing zones are where individual application teams deploy, inheriting platform-level governance.",
    why: "Separates shared foundational concerns from workload-specific ones.",
    topic: "Landing Zones",
  },
];
