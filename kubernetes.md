# On-Premise Kubernetes Architecture Blueprint

## Stack: Node.js, PostgreSQL, BullMQ, KEDA, & External AI Integration

This document outlines a production-ready, cloud-native architecture for hosting an enterprise application entirely on-premise. It replaces proprietary cloud services with robust, open-source alternatives while maintaining scalability, resilience, observability, and operational simplicity.

---

# 1. High-Level Architecture

```text
┌─────────────────────────────────────────────┐
│      On-Premise Hardware / VM Fleet         │
└─────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│       MetalLB / Kube-VIP Load Balancer      │
│          (BGP / Layer 2 Routing)            │
└─────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│      Kubernetes Gateway API / Cilium        │
└─────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────────┐      ┌───────────────────┐
│   Node.js API     │      │  Node.js Workers  │
│       Pods        │      │       Pods        │
└───────────────────┘      └───────────────────┘
        │                             │
        │ Task Distribution           │ Event Processing
        ▼                             ▼
┌───────────────────┐      ┌───────────────────┐
│ Redis Cluster     │      │ PostgreSQL        │
│ (BullMQ Backend)  │      │ (CloudNativePG)   │
└───────────────────┘      └───────────────────┘
        ▲                             ▲
        └────────── Persistent ───────┘
                     Storage
                           │
                           ▼
┌─────────────────────────────────────────────┐
│          Ceph (Rook) / Local PVs            │
└─────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────┐
│  Outbound Proxy / Firewall Egress Control   │
└─────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────┐
│ External AI APIs                            │
│ (OpenAI, Anthropic, Gemini, etc.)           │
└─────────────────────────────────────────────┘
```

---

# 2. Core Operational Layers

## 🌐 Core Engine & Storage Infrastructure

### Cluster Management

Deploy a Kubernetes cluster using one of the following approaches:

* **Vanilla Kubernetes** via `kubeadm`
* **RKE2 (SUSE Rancher)** for enterprise-grade operations
* **Talos Linux** for a secure, immutable, minimal-overhead control plane

### Database

Run PostgreSQL inside the cluster using **CloudNativePG**.

Benefits include:

* Automated replication
* Automated failover
* Health monitoring
* Backup management
* Built-in PgBouncer management
* Kubernetes-native operations

### Persistent Storage

Use one of the following storage platforms:

* **Rook-Ceph**
* **Longhorn**

These solutions aggregate local disks into highly available distributed storage for:

* PostgreSQL data
* Redis persistence
* Application stateful workloads

---

## 📥 Enterprise Messaging & Queue Infrastructure

### Event Streaming

Use **NATS JetStream** for asynchronous communication between services.

Benefits:

* Lightweight and high-performance
* Cloud-native architecture
* Persistent event streams
* Horizontal scalability

### Task Queue

Deploy a highly available **Redis Cluster** using a Redis Operator.

Redis serves as the backing store for:

* BullMQ job queues
* Delayed jobs
* Scheduled tasks
* Distributed worker coordination

---

## ⏱️ Scaling & Network Automation

### Bare-Metal Load Balancing

Use:

* **MetalLB**
* **Kube-VIP**

Together, they provide cloud-like Load Balancer capabilities for on-premise Kubernetes environments.

### Ingress & Routing

Adopt the **Kubernetes Gateway API** implemented through **Cilium**.

Benefits include:

* Modern networking model
* Enhanced traffic management
* Better security controls
* Future-proof Kubernetes networking

### Event-Driven Autoscaling

Deploy **KEDA (Kubernetes Event-Driven Autoscaling)**.

KEDA monitors:

* Redis/BullMQ queue depth
* NATS JetStream lag
* Other event sources

Scaling behavior:

* Scale worker pods to zero during idle periods
* Rapidly scale out during AI processing spikes
* Reduce infrastructure costs and resource consumption

### Scheduled Jobs

Use:

* **Kubernetes CronJobs** for infrastructure-level scheduling
* **BullMQ Repeatable Jobs** for application-level scheduling

Choose based on ownership and operational requirements.

---

## 🤖 Resilient External AI Integration

### Egress Control & Security

Use **Cilium** as the cluster CNI.

Implement **Cilium Egress Gateway** policies to:

* Route all AI traffic through approved proxies
* Enforce firewall compliance
* Audit outbound requests
* Enable IP safelisting
* Centralize rate limiting

### AI Application Framework

Use either:

* **LangChain.js**
* **LlamaIndex TS**

Responsibilities include:

* Prompt orchestration
* Retrieval-augmented generation (RAG)
* Structured outputs
* Tool calling
* Context management

### Secrets Management

Use:

* **HashiCorp Vault**
* **External Secrets Operator**

Benefits:

* No secrets stored in Git
* Dynamic secret rotation
* Centralized credential management
* Secure Kubernetes secret injection

---

## 📊 Observability (LGTM Stack)

### Metrics & Dashboards

**Prometheus + Grafana**

Monitor:

* Node.js performance
* PostgreSQL metrics
* Redis performance
* Cluster health
* Hardware utilization

### Log Aggregation

**Grafana Loki**

Log collection via:

* Vector
* Fluent Bit

### Distributed Tracing

**Grafana Tempo + OpenTelemetry**

Trace requests across:

1. API services
2. Queue systems
3. Worker processes
4. External AI providers

This enables rapid identification of latency bottlenecks and system failures.

---

# 3. Key Implementation Decisions

## 1. Deployment Standardization

Use **Helm Charts** for packaging and deployment.

Benefits:

* Consistent environments
* Reusable configurations
* Simplified upgrades
* GitOps compatibility

## 2. Node.js Runtime Optimization

Configure explicit Kubernetes resource limits:

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

Also configure:

```bash
--max-old-space-size=<value>
```

This helps prevent unexpected Out-Of-Memory (OOM) kills.

## 3. Database Performance Optimization

Map CloudNativePG storage classes directly to high-performance NVMe-backed storage managed by Rook-Ceph.

Benefits:

* Faster write throughput
* Lower latency
* Better PostgreSQL replication performance
* Improved durability and failover recovery

```
```
