# 🎬 CineVault - Project Context & Technical Specification

> **Version:** 2.0.0  
> **Last Updated:** December 8, 2024  
> **Status:** Active Development

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision & Principles](#project-vision--principles)
3. [Target Users & Personas](#target-users--personas)
4. [Technical Architecture](#technical-architecture)
5. [Feature Specifications](#feature-specifications)
6. [Data Models & Schema](#data-models--schema)
7. [API Contracts](#api-contracts)
8. [User Experience Flows](#user-experience-flows)
9. [Security & Compliance](#security--compliance)
10. [Infrastructure & DevOps](#infrastructure--devops)
11. [Testing Strategy](#testing-strategy)
12. [Roadmap & Milestones](#roadmap--milestones)
13. [Legal & Policy](#legal--policy)

---

## 🎯 Executive Summary

### What is CineVault?

**CineVault** is an open-source, self-hostable video streaming platform designed for communities, creators, and organizations to host, manage, and distribute video content legally and ethically. Unlike centralized platforms, CineVault puts control in the hands of instance operators while providing a Netflix-quality viewing experience.

### Key Differentiators

| Feature | CineVault | Traditional Platforms |
|---------|-----------|----------------------|
| **Hosting** | Self-hosted, you own your data | Centralized, platform owns data |
| **Monetization** | 100% creator revenue (no platform cut) | 30-55% platform fees |
| **Customization** | Full white-label, themes, plugins | Limited branding options |
| **Privacy** | Zero telemetry by default | Extensive user tracking |
| **Content Policy** | You define the rules | Platform-imposed restrictions |
| **Cost** | Pay only for infrastructure | Revenue sharing + fees |

### Success Metrics

| Metric | Target (MVP) | Target (Scale) |
|--------|-------------|----------------|
| Stream Start Time | < 2 seconds | < 500ms |
| Buffering Ratio | < 1% | < 0.1% |
| Concurrent Viewers | 100/instance | 10,000+/instance |
| Upload-to-Publish | < 5 minutes | < 2 minutes |
| Uptime SLA | 99.5% | 99.99% |

---

## 🌟 Project Vision & Principles

### Core Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                     CINEVAULT PRINCIPLES                        │
├─────────────────────────────────────────────────────────────────┤
│  🏠 SELF-HOSTABLE    │  Run anywhere: laptop, VPS, Kubernetes  │
│  ⚖️  LEGAL-BY-DEFAULT │  Only licensed/owned content supported  │
│  🔌 EXTENSIBLE       │  Plugin architecture for customization  │
│  👨‍💻 DEVELOPER-FIRST  │  Exceptional DX with modern tooling     │
│  🔒 PRIVACY-FOCUSED  │  Minimal data collection, user control  │
│  ⚡ PERFORMANT       │  CDN-ready, adaptive streaming, fast    │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Principles

#### 1. Self-Hostable Architecture
- **Single Command Deploy**: `docker compose up` starts entire stack
- **Minimal Dependencies**: PostgreSQL, Redis, S3-compatible storage
- **Resource Efficient**: Runs on 2GB RAM VPS for small communities
- **Kubernetes Ready**: Helm charts for enterprise deployments
- **Air-Gapped Support**: Works without external network dependencies

#### 2. Legal-First Content Strategy
- **License Declaration**: Mandatory license selection on every upload
- **Embedded Sources**: First-class support for YouTube, Vimeo, Archive.org
- **DMCA Workflow**: Built-in takedown request handling
- **Audit Trail**: Complete logging of content lifecycle
- **No DRM Circumvention**: Explicitly forbidden in codebase and docs

#### 3. Extensible Plugin System
- **Themes**: Custom CSS, layouts, component overrides
- **Storage Adapters**: S3, GCS, Azure Blob, IPFS, local filesystem
- **Auth Providers**: OAuth, SAML, LDAP via Better-Auth
- **Recommenders**: Pluggable algorithms for content suggestions
- **Webhooks**: Event-driven integrations with external systems

#### 4. Developer Experience Excellence
- **Type Safety**: End-to-end TypeScript with tRPC contracts
- **Hot Reload**: Sub-second refresh in development
- **Monorepo**: Turborepo for efficient builds and caching
- **Documentation**: Interactive API docs, code examples
- **Testing**: Comprehensive test suite with high coverage

---

## 👥 Target Users & Personas

### Primary Personas

#### 🎨 Creator (Content Owner)
```yaml
Role: Uploads and manages own/licensed content
Goals:
  - Build audience without platform restrictions
  - Retain 100% of monetization revenue
  - Full creative control over presentation
  - Analytics to understand audience
Pain Points:
  - Platform algorithm changes affecting reach
  - High revenue sharing with big platforms
  - Content demonetization without explanation
  - Limited customization options
```

#### 🏛️ Community Administrator
```yaml
Role: Runs CineVault instance for organization/community
Goals:
  - Provide video platform for members
  - Moderate content effectively
  - Manage user access and roles
  - Control costs and resources
Pain Points:
  - Expensive enterprise video solutions
  - Lack of control over platform policies
  - Data privacy concerns with SaaS
  - Vendor lock-in
```

#### 👀 Viewer (Consumer)
```yaml
Role: Discovers and watches content
Goals:
  - Find relevant content easily
  - Smooth playback experience
  - Engage with creators and community
  - Access on any device
Pain Points:
  - Intrusive advertisements
  - Privacy-invasive tracking
  - Poor recommendation quality
  - Limited accessibility features
```

#### 🔧 Developer (Integrator)
```yaml
Role: Extends CineVault functionality
Goals:
  - Build custom features and integrations
  - Contribute to open source project
  - Create themes and plugins
  - Integrate with existing systems
Pain Points:
  - Poor API documentation
  - Lack of extension points
  - Complex local development setup
  - Breaking changes without notice
```

---

## 🏗️ Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                     │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │         CDN LAYER         │
                    │  (CloudFlare/Fastly/AWS)  │
                    │  - Static assets          │
                    │  - HLS segments           │
                    │  - Thumbnails             │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
┌────────▼────────┐    ┌─────────▼─────────┐    ┌────────▼────────┐
│   NEXT.JS APP   │    │    tRPC API       │    │  MEDIA SERVER   │
│   (Frontend)    │◄──►│    (Backend)      │    │  (HLS/DASH)     │
│                 │    │                   │    │                 │
│ - SSR/SSG pages │    │ - Auth endpoints  │    │ - Manifest gen  │
│ - React UI      │    │ - CRUD operations │    │ - Signed URLs   │
│ - Video player  │    │ - Business logic  │    │ - Token auth    │
└────────┬────────┘    └─────────┬─────────┘    └────────┬────────┘
         │                       │                        │
         │              ┌────────▼────────┐              │
         │              │   BETTER-AUTH   │              │
         │              │   (Auth Layer)  │              │
         │              │                 │              │
         │              │ - Sessions      │              │
         │              │ - OAuth/SSO     │              │
         │              │ - Role mgmt     │              │
         │              └────────┬────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      DATA LAYER         │
                    ├─────────────────────────┤
                    │  ┌─────────────────┐    │
                    │  │   PostgreSQL    │    │
                    │  │   (Drizzle ORM) │    │
                    │  │                 │    │
                    │  │ - Users/Roles   │    │
                    │  │ - Assets        │    │
                    │  │ - Channels      │    │
                    │  │ - Analytics     │    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │     Redis       │    │
                    │  │   (Caching)     │    │
                    │  │                 │    │
                    │  │ - Sessions      │    │
                    │  │ - Rate limits   │    │
                    │  │ - Job queues    │    │
                    │  └─────────────────┘    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    WORKER LAYER         │
                    ├─────────────────────────┤
                    │  ┌─────────────────┐    │
                    │  │ Transcode Worker│    │
                    │  │                 │    │
                    │  │ - FFmpeg        │    │
                    │  │ - HLS encoding  │    │
                    │  │ - Thumbnails    │    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │Analytics Worker │    │
                    │  │                 │    │
                    │  │ - Event ingest  │    │
                    │  │ - Aggregation   │    │
                    │  │ - Reports       │    │
                    │  └─────────────────┘    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    OBJECT STORAGE       │
                    │   (S3-Compatible)       │
                    │                         │
                    │ - Raw uploads           │
                    │ - HLS segments          │
                    │ - Thumbnails            │
                    │ - Captions (WebVTT)     │
                    └─────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| **Runtime** | Bun | 1.1+ | 3x faster than Node, native TS |
| **Framework** | Next.js | 14+ | App Router, SSR, React Server Components |
| **API** | tRPC | 11+ | E2E type safety, excellent DX |
| **Database** | PostgreSQL | 16+ | Reliability, JSON support, full-text search |
| **ORM** | Drizzle | Latest | Type-safe, performant, great migrations |
| **Auth** | Better-Auth | Latest | Flexible, supports OAuth/SSO/magic links |
| **Cache/Queue** | Redis | 7+ | Fast caching, pub/sub, job queues |
| **Storage** | S3-Compatible | - | MinIO (dev), AWS S3/DO Spaces (prod) |
| **Streaming** | HLS/DASH | - | Universal compatibility, adaptive bitrate |
| **Transcode** | FFmpeg | 6+ | Industry standard, comprehensive codec support |
| **Monorepo** | Turborepo | Latest | Fast builds, intelligent caching |
| **UI** | shadcn/ui + Radix | Latest | Accessible, customizable components |
| **Styling** | Tailwind CSS | 3+ | Utility-first, consistent design system |

### Monorepo Structure

```
cinevault/
├── 📁 apps/
│   ├── 📁 web/                    # Next.js frontend application
│   │   ├── 📁 src/
│   │   │   ├── 📁 app/            # App Router pages
│   │   │   │   ├── 📁 (auth)/     # Auth routes (login, register)
│   │   │   │   ├── 📁 (main)/     # Main app routes
│   │   │   │   │   ├── 📁 browse/ # Content discovery
│   │   │   │   │   ├── 📁 watch/  # Video playback
│   │   │   │   │   ├── 📁 channel/# Channel pages
│   │   │   │   │   └── 📁 upload/ # Upload flow
│   │   │   │   ├── 📁 studio/     # Creator studio
│   │   │   │   ├── 📁 admin/      # Admin panel
│   │   │   │   └── 📁 api/        # API routes
│   │   │   ├── 📁 components/     # React components
│   │   │   │   ├── 📁 player/     # Video player
│   │   │   │   ├── 📁 upload/     # Upload components
│   │   │   │   ├── 📁 catalog/    # Browse/search
│   │   │   │   └── 📁 layout/     # Layout components
│   │   │   ├── 📁 hooks/          # Custom React hooks
│   │   │   ├── 📁 lib/            # Utility libraries
│   │   │   └── 📁 styles/         # Global styles
│   │   ├── 📄 next.config.js
│   │   └── 📄 package.json
│   │
│   ├── 📁 api/                    # tRPC API server
│   │   ├── 📁 src/
│   │   │   ├── 📁 routers/        # tRPC routers
│   │   │   │   ├── 📄 auth.ts
│   │   │   │   ├── 📄 catalog.ts
│   │   │   │   ├── 📄 upload.ts
│   │   │   │   ├── 📄 player.ts
│   │   │   │   ├── 📄 moderation.ts
│   │   │   │   └── 📄 analytics.ts
│   │   │   ├── 📁 services/       # Business logic
│   │   │   ├── 📁 middleware/     # Auth, rate limiting
│   │   │   └── 📄 index.ts        # Server entry
│   │   └── 📄 package.json
│   │
│   └── 📁 worker/                 # Background workers
│       ├── 📁 src/
│       │   ├── 📁 jobs/           # Job handlers
│       │   │   ├── 📄 transcode.ts
│       │   │   ├── 📄 thumbnail.ts
│       │   │   └── 📄 analytics.ts
│       │   ├── 📁 processors/     # FFmpeg wrappers
│       │   └── 📄 index.ts        # Worker entry
│       └── 📄 package.json
│
├── 📁 packages/
│   ├── 📁 ui/                     # Shared UI components
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   ├── 📁 primitives/     # Base components
│   │   │   └── 📁 styles/         # Design tokens
│   │   └── 📄 package.json
│   │
│   ├── 📁 db/                     # Database package
│   │   ├── 📁 src/
│   │   │   ├── 📁 schema/         # Drizzle schema
│   │   │   ├── 📁 migrations/     # SQL migrations
│   │   │   └── 📄 client.ts       # DB client
│   │   ├── 📄 drizzle.config.ts
│   │   └── 📄 package.json
│   │
│   ├── 📁 shared/                 # Shared utilities
│   │   ├── 📁 src/
│   │   │   ├── 📁 types/          # TypeScript types
│   │   │   ├── 📁 constants/      # Shared constants
│   │   │   ├── 📁 validators/     # Zod schemas
│   │   │   └── 📁 utils/          # Helper functions
│   │   └── 📄 package.json
│   │
│   └── 📁 config/                 # Shared configs
│       ├── 📄 eslint-config.js
│       ├── 📄 tsconfig.json
│       └── 📄 tailwind.config.js
│
├── 📁 infra/
│   ├── 📁 docker/                 # Docker configurations
│   │   ├── 📄 Dockerfile.web
│   │   ├── 📄 Dockerfile.api
│   │   ├── 📄 Dockerfile.worker
│   │   └── 📄 docker-compose.yml
│   ├── 📁 kubernetes/             # K8s manifests
│   │   ├── 📁 helm/               # Helm charts
│   │   └── 📁 manifests/          # Raw YAML
│   └── 📁 scripts/                # Deployment scripts
│       ├── 📄 seed.ts             # Database seeding
│       ├── 📄 migrate.ts          # Migration runner
│       └── 📄 dev.sh              # Dev startup
│
├── 📁 docs/                       # Documentation
│   ├── 📄 API.md
│   ├── 📄 DEPLOYMENT.md
│   ├── 📄 DEVELOPMENT.md
│   └── 📄 ARCHITECTURE.md
│
├── 📄 turbo.json                  # Turborepo config
├── 📄 package.json                # Root package.json
├── 📄 .env.example                # Environment template
└── 📄 README.md                   # Project README
```

---

## 📦 Feature Specifications

### MVP Features (Phase 1)

#### 1. Authentication & Authorization

**Description:** Complete user authentication system with role-based access control.

| Component | Details |
|-----------|---------|
| **Registration** | Email/password with email verification, OAuth (Google, GitHub) |
| **Login** | Password, magic link, OAuth redirect flow |
| **Sessions** | JWT with refresh tokens, secure httpOnly cookies |
| **Roles** | `admin`, `creator`, `viewer` with granular permissions |
| **Profile** | Avatar, display name, bio, social links |

**User Stories:**
- As a new user, I can register with email/password or OAuth
- As a user, I can log in and maintain session across browser refreshes
- As an admin, I can assign roles to other users
- As a creator, I can access upload functionality
- As a viewer, I can watch public content without account

**API Endpoints:**
```typescript
auth.register({ email, password, name })        // Create account
auth.login({ email, password })                  // Authenticate
auth.logout()                                    // Destroy session
auth.refreshSession()                            // Extend session
auth.connectProvider({ provider, token })        // Link OAuth
auth.updateProfile({ name, avatar, bio })        // Edit profile
auth.changePassword({ current, new })            // Update password
auth.requestPasswordReset({ email })             // Forgot password
auth.verifyEmail({ token })                      // Email verification
```

#### 2. Video Upload & Processing

**Description:** Complete workflow for uploading video files with automatic transcoding to HLS format.

**Upload Flow:**
```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Browser │───►│ Pre-signed  │───►│ Object Store │───►│  Finalize   │
│         │    │ URL Request │    │ Direct Upload│    │  + Transcode│
└─────────┘    └─────────────┘    └──────────────┘    └─────────────┘
     │                                                        │
     │              ┌────────────────────────────────────────┐│
     └──────────────│      Progress Tracking (SSE/WS)        │┘
                    └────────────────────────────────────────┘
```

**Upload Specifications:**
| Attribute | Value |
|-----------|-------|
| Max file size | 10GB (configurable) |
| Supported formats | MP4, MOV, AVI, MKV, WebM |
| Chunk size | 5MB for resumable uploads |
| TTL for signed URL | 15 minutes |
| Metadata fields | Title, description, tags, license, visibility |

**Transcoding Profiles:**
| Profile | Resolution | Bitrate | Audio |
|---------|------------|---------|-------|
| 1080p | 1920x1080 | 5 Mbps | 192 kbps AAC |
| 720p | 1280x720 | 2.5 Mbps | 128 kbps AAC |
| 480p | 854x480 | 1 Mbps | 96 kbps AAC |
| 360p | 640x360 | 500 kbps | 64 kbps AAC |
| Audio | - | - | 128 kbps AAC |

**API Endpoints:**
```typescript
upload.createAsset({ title, description, tags, license, visibility })
upload.requestUploadUrl({ assetId, fileName, fileSize, contentType })
upload.finalizeUpload({ assetId, uploadId })
upload.getUploadStatus({ assetId })
upload.cancelUpload({ assetId })
upload.updateMetadata({ assetId, title, description, tags })
```

#### 3. Video Player

**Description:** Feature-rich video player with adaptive streaming and accessibility support.

**Player Features:**
- ▶️ Play/Pause with keyboard shortcuts (Space, K)
- ⏩ Seek with progress bar, arrow keys, J/L
- 🔊 Volume control with mute toggle (M)
- 📺 Fullscreen mode (F)
- 🖼️ Picture-in-Picture (P)
- ⚡ Playback speed (0.25x - 2x)
- 📊 Quality selection (Auto, 1080p, 720p, etc.)
- 💬 Closed captions toggle (C)
- ⏭️ Chapter navigation
- 📱 Touch-friendly mobile controls
- ⌨️ Full keyboard accessibility

**Technical Implementation:**
```typescript
interface PlayerProps {
  manifestUrl: string;           // HLS/DASH manifest
  poster?: string;               // Thumbnail image
  captions?: CaptionTrack[];     // WebVTT tracks
  chapters?: Chapter[];          // Chapter markers
  startTime?: number;            // Resume position
  autoplay?: boolean;            // Auto-start
  onProgress?: (time: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}
```

#### 4. Content Catalog

**Description:** Browsable and searchable content library with filtering and discovery features.

**Catalog Features:**
- 🔍 Full-text search with relevance ranking
- 🏷️ Filter by tags, categories, duration, date
- 📊 Sort by newest, popular, trending
- 📄 Pagination with infinite scroll option
- 🎯 Related content suggestions
- 📺 Channel browsing and following
- 📋 Playlist viewing and creation

**Search Capabilities:**
| Feature | Implementation |
|---------|---------------|
| Full-text | PostgreSQL tsvector with ranking |
| Fuzzy matching | pg_trgm extension |
| Autocomplete | Prefix matching with caching |
| Filters | Indexed columns with query building |
| Facets | Aggregated counts for filter UI |

**API Endpoints:**
```typescript
catalog.search({ query, filters, sort, page, limit })
catalog.getAsset({ id })
catalog.getRelated({ assetId, limit })
catalog.listChannels({ sort, page })
catalog.getChannel({ id })
catalog.getChannelAssets({ channelId, page })
catalog.getTrending({ period, limit })
catalog.getNew({ limit })
```

#### 5. Admin & Moderation

**Description:** Administrative tools for managing users, content, and platform settings.

**Admin Dashboard Features:**
- 👥 User management (list, search, edit, ban)
- 🎬 Content overview with bulk actions
- 🚨 Moderation queue for flagged content
- 📊 Platform analytics and metrics
- ⚙️ System configuration
- 📝 Audit logs

**Moderation Workflow:**
```
┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────┐
│ User     │───►│ Content      │───►│ Review Queue  │───►│ Decision   │
│ Reports  │    │ Flagged      │    │ (Admin Panel) │    │ + Log      │
└──────────┘    └──────────────┘    └───────────────┘    └────────────┘
      │                                      │
      │         ┌────────────────────────────┘
      │         ▼
      │    ┌──────────┐    ┌──────────┐    ┌──────────┐
      │    │ Approve  │    │ Warn     │    │ Takedown │
      │    └──────────┘    └──────────┘    └──────────┘
      │                                          │
      └──────────────────────────────────────────┘
                    Strike System
```

**API Endpoints:**
```typescript
moderation.getQueue({ status, page })
moderation.getReport({ id })
moderation.resolveReport({ id, action, reason })
moderation.flagContent({ assetId, reason, details })
moderation.warnUser({ userId, reason })
moderation.banUser({ userId, reason, duration })
moderation.getLogs({ filters, page })
admin.getUsers({ search, role, status, page })
admin.updateUser({ id, role, status })
admin.getStats()
admin.getSystemHealth()
```

---

### Phase 2 Features (Enhanced)

#### 6. Channel Management

**Description:** Creator channels for organizing and presenting content with customization options.

**Channel Features:**
| Feature | Description |
|---------|-------------|
| **Customization** | Banner image, avatar, custom URL slug, description |
| **Sections** | Organize videos into featured sections |
| **Playlists** | Create and manage video collections |
| **About** | Links, contact info, channel stats |
| **Community** | Posts, polls, discussions |
| **Analytics** | Views, subscribers, engagement metrics |

**Channel Settings:**
```typescript
interface ChannelSettings {
  name: string;
  slug: string;                    // unique URL path
  description: string;
  avatar: string;                  // URL to avatar image
  banner: string;                  // URL to banner image
  visibility: 'public' | 'unlisted' | 'private';
  allowComments: boolean;
  moderationLevel: 'all' | 'reviewed' | 'none';
  featuredVideo?: string;          // Asset ID
  links: { platform: string; url: string }[];
  contact: { type: string; value: string }[];
}
```

#### 7. Subscriptions & Watchlist

**Description:** User engagement features for following channels and saving content.

**Features:**
- 📺 Subscribe to channels with notification preferences
- 🔔 Notification options: All, Personalized, None
- 📋 Watch Later playlist for saving videos
- 📚 Custom playlists with ordering
- 📊 Subscription feed with algorithm options

#### 8. Comments & Reactions

**Description:** Community engagement through comments and reactions on content.

**Comment Features:**
| Feature | Description |
|---------|-------------|
| **Threading** | Nested replies with depth limit |
| **Reactions** | Like, heart, other emoji reactions |
| **Mentions** | @username notifications |
| **Timestamps** | Link to specific video time |
| **Moderation** | Report, hide, pin (creator) |
| **Spam Protection** | Rate limiting, link filtering |

**Comment Schema:**
```typescript
interface Comment {
  id: string;
  assetId: string;
  authorId: string;
  body: string;
  parentId?: string;              // For replies
  timestamp?: number;             // Video timestamp reference
  reactions: { [emoji: string]: number };
  status: 'visible' | 'hidden' | 'deleted';
  isPinned: boolean;
  isCreatorReply: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9. OAuth & Social Login

**Description:** Additional authentication providers for seamless signup/login.

**Supported Providers:**
| Provider | Scope | Data Retrieved |
|----------|-------|----------------|
| Google | profile, email | Name, email, avatar |
| GitHub | user:email | Name, email, avatar |
| Discord | identify, email | Name, email, avatar |
| Twitter | read | Name, handle, avatar |
| Apple | name, email | Name, email |

#### 10. External Embeds

**Description:** Support for embedding content from external platforms.

**Supported Platforms:**
| Platform | Embed Type | Validation |
|----------|------------|------------|
| YouTube | iframe | Domain allowlist, oEmbed |
| Vimeo | iframe | Domain allowlist, oEmbed |
| Twitch | iframe | Domain allowlist |
| Archive.org | iframe/direct | Public domain check |
| Custom | iframe | Admin-approved domains |

---

### Phase 3 Features (Advanced)

#### 11. Live Streaming

**Description:** Real-time video broadcasting with low-latency delivery.

**Live Stream Architecture:**
```
┌──────────┐    ┌───────────────┐    ┌───────────────┐    ┌──────────┐
│ Streamer │───►│ RTMP/SRT      │───►│ Live          │───►│ Viewers  │
│  (OBS)   │    │ Ingest Server │    │ Transcoder    │    │  (HLS)   │
└──────────┘    └───────────────┘    └───────────────┘    └──────────┘
                        │                    │
                        ▼                    ▼
                 ┌──────────────┐    ┌──────────────┐
                 │ Stream Key   │    │ Multi-bitrate│
                 │ Validation   │    │ HLS Output   │
                 └──────────────┘    └──────────────┘
```

**Stream Specifications:**
| Feature | Specification |
|---------|---------------|
| Ingest Protocols | RTMP, SRT, WebRTC |
| Max Bitrate | 12 Mbps (6k) |
| Latency Modes | Normal (15-30s), Low (5-10s), Ultra-low (<3s) |
| Transcoding | 1080p60, 720p60, 480p30, 360p30 |
| DVR | Up to 4 hours rewind |
| Recording | Automatic VOD creation |

**Live Interaction Features:**
- 💬 Live chat with moderation tools
- 📊 Viewer count and engagement metrics
- 🎯 Go-live notifications to subscribers
- 📌 Pinned messages and announcements
- 🔨 Mod tools: timeout, ban, slow mode
- 💰 Super chats and tips (monetization)

#### 12. Plugin System

**Description:** Extensibility framework for custom themes, adapters, and features.

**Plugin Types:**
| Type | Description | Examples |
|------|-------------|----------|
| **Themes** | Custom styling and layouts | Dark modes, brand themes |
| **Storage** | Object storage adapters | S3, GCS, Azure, IPFS |
| **Auth** | Authentication providers | LDAP, SAML, custom OAuth |
| **Recommenders** | Content suggestion algorithms | ML-based, collaborative |
| **Analytics** | Custom tracking/reporting | Export to BI tools |
| **Webhooks** | Event-driven integrations | Discord, Slack, Zapier |

**Plugin API:**
```typescript
interface CineVaultPlugin {
  name: string;
  version: string;
  type: PluginType;
  
  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  
  // Extension points
  routes?: RouteDefinition[];
  components?: ComponentOverride[];
  hooks?: EventHook[];
  settings?: SettingsSchema;
}
```

#### 13. Monetization Suite

**Description:** Complete revenue generation toolkit for creators and platform operators.

**Revenue Streams:**
| Model | Description | Platform Fee |
|-------|-------------|--------------|
| **Subscriptions** | Monthly channel membership | Configurable (0-30%) |
| **Pay-per-View** | One-time content purchase | Configurable |
| **Tips/Donations** | Voluntary viewer support | Configurable |
| **Ads** | Pre-roll, mid-roll, display | 100% to operator |
| **Merchandise** | Integrated storefront | External (Shopify, etc.) |

**Subscription Tiers:**
```typescript
interface SubscriptionTier {
  id: string;
  channelId: string;
  name: string;                    // e.g., "Supporter", "VIP"
  price: number;                   // Monthly in cents
  currency: string;
  benefits: {
    adFree: boolean;
    earlyAccess: boolean;
    exclusiveContent: boolean;
    chatBadge: boolean;
    customEmotes: string[];
    behindTheScenes: boolean;
    directMessages: boolean;
  };
}
```

---

### Phase 4-18 Comprehensive Feature List

Below is the complete feature catalog organized by phase:

---

## 🌐 Social & Community Features (Phase 4)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Follow System** | Follow users and channels with mutual follow detection, friend suggestions based on viewing habits and connections | High |
| 2 | **Notifications** | Multi-channel notifications (in-app, email, push) with granular preferences per notification type | High |
| 3 | **Direct Messages** | Private messaging between users with read receipts, typing indicators, media sharing | Medium |
| 4 | **Group Chats** | Community chat rooms with moderator controls, roles, slow mode | Medium |
| 5 | **Activity Feed** | Social feed showing friend activity, likes, new uploads, comments | High |
| 6 | **Social Cards** | Rich Open Graph and Twitter Card previews for shared links | High |
| 7 | **Collaborative Playlists** | Multi-user editable playlists with permission controls | Medium |
| 8 | **Watch Parties** | Synchronized playback with integrated chat for group viewing | Medium |
| 9 | **Mentions** | @username mentions in comments and descriptions with notifications | High |
| 10 | **Hashtags** | Tagging system with trending topics and hashtag following | Medium |
| 11 | **Community Posts** | Text, image, poll posts for creators to engage audience between videos | High |
| 12 | **Verification** | Verified badges for authentic accounts with application process | Medium |
| 13 | **Co-authoring** | Multi-creator collaboration on single videos with credit attribution | Low |
| 14 | **Fan Clubs** | Exclusive membership groups with special content and perks | Low |
| 15 | **Cross-posting** | Share to Twitter, Facebook, Reddit, Discord with webhooks | Medium |

---

## 🔍 Discovery & Recommendations (Phase 5)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 16 | **AI Recommendations** | Personalized suggestions using collaborative filtering and content-based algorithms | High |
| 17 | **Smart Playlists** | Auto-generated "Continue Watching", "Watch Again", "New from Subscriptions" | High |
| 18 | **Content Clustering** | Organize by genre, mood, era, language, theme with ML classification | Medium |
| 19 | **Similar Content** | "More like this" suggestions on video pages | High |
| 20 | **Trending Algorithm** | Time-decay scoring with engagement velocity for trending lists | High |
| 21 | **Explore Page** | Curated collections by editors and algorithmic picks | High |
| 22 | **Search Autocomplete** | Fuzzy matching, spell correction, search suggestions | High |
| 23 | **Advanced Filters** | Duration, upload date, resolution, license, subtitles, features | Medium |
| 24 | **Watch History** | Persistent history with resume position across devices | High |
| 25 | **Not Interested** | Hide content and train recommendation algorithm | Medium |
| 26 | **Series Detection** | Auto-detect episode sequences with next-up suggestions | Medium |
| 27 | **Scheduled Drops** | Countdown timers for upcoming content premieres | Low |
| 28 | **Premieres** | First-viewing events with live chat during scheduled release | Medium |
| 29 | **Geo-based Discovery** | Local creators, regional trending, location-aware recommendations | Low |
| 30 | **Cross-channel** | Discover related channels based on viewing patterns | Medium |

---

## 🎬 Creator Studio (Phase 6)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 31 | **Video Editor** | In-browser trim, cut, merge, music, transitions, effects | Medium |
| 32 | **AI Thumbnails** | Auto-generated thumbnail options from video frames with ML scoring | High |
| 33 | **End Screens** | Customizable end cards with clickable elements | Medium |
| 34 | **Info Cards** | Mid-video overlays for polls, links, related content | Medium |
| 35 | **Chapters** | Visual markers with timeline navigation and auto-detection | High |
| 36 | **A/B Testing** | Split test thumbnails and titles with performance analytics | Medium |
| 37 | **Scheduling** | Timezone-aware publish scheduling with calendar view | High |
| 38 | **Drafts** | Auto-save with version history and collaborative editing | High |
| 39 | **Bulk Upload** | Multi-file upload with metadata templates | Medium |
| 40 | **Templates** | Reusable metadata templates for series content | Medium |
| 41 | **Caption Editor** | Visual subtitle editor with waveform and timing tools | High |
| 42 | **Auto Captions** | AI transcription in multiple languages with editing | High |
| 43 | **Video Analytics** | Per-video watch time, retention graphs, traffic sources | High |
| 44 | **Revenue Dashboard** | Earnings tracking, payout history, tax documents | High |
| 45 | **Copyright Claims** | Dispute workflow for Content ID matches | Medium |
| 46 | **Content ID** | Fingerprinting for original content protection | Low |
| 47 | **Team Access** | Invite editors, managers, translators with role permissions | High |
| 48 | **Brand Kit** | Managed logos, watermarks, intros, outros | Medium |
| 49 | **Video Responses** | Reply system linking videos together | Low |
| 50 | **Pinned Comments** | Creator-pinned and highlighted replies | High |

---

## 💰 Monetization & Commerce (Phase 7)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 51 | **Subscription Tiers** | Multi-tier memberships with customizable benefits | High |
| 52 | **Pay-per-View** | One-time purchase for premium content | High |
| 53 | **Tips & Super Chat** | Voluntary donations with live stream highlighting | High |
| 54 | **Virtual Currency** | Platform coins for tipping and premium features | Medium |
| 55 | **Merchandise Shelf** | Shopify, WooCommerce integration for product sales | Medium |
| 56 | **Affiliate Links** | Tracked affiliate program with analytics | Medium |
| 57 | **Sponsorship Marketplace** | Connect creators with brand opportunities | Low |
| 58 | **Ad System** | Self-serve ads with targeting and reporting | Medium |
| 59 | **Revenue Split** | Configurable splits for collaborations | High |
| 60 | **Gift Cards** | Purchasable gift subscriptions and currency | Medium |
| 61 | **Crowdfunding** | Patreon-style recurring support campaigns | Medium |
| 62 | **Early Access** | Subscriber-only early release window | High |
| 63 | **Digital Downloads** | Bonus content, assets, PDFs for sale | Medium |
| 64 | **Channel Bundles** | Multi-channel subscription packages | Low |
| 65 | **Payout Dashboard** | Earnings, tax forms, payment methods, history | High |

---

## 📱 Mobile & Cross-Platform (Phase 8)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 66 | **PWA** | Installable web app with offline support | High |
| 67 | **Native Apps** | iOS and Android apps with React Native/Expo | High |
| 68 | **Background Audio** | Continue playback with screen off for podcasts/music | High |
| 69 | **Picture-in-Picture** | Floating player while browsing | High |
| 70 | **Casting** | Chromecast and AirPlay support | High |
| 71 | **Offline Downloads** | Download for offline viewing with quality selection | High |
| 72 | **Mobile Gestures** | Double-tap seek, swipe volume/brightness | High |
| 73 | **Camera Upload** | Direct upload from device camera roll | Medium |
| 74 | **QR Sharing** | Quick share via scannable codes | Medium |
| 75 | **Deep Links** | Universal links for app/web seamless transitions | High |
| 76 | **Desktop Apps** | Electron apps for Windows, macOS, Linux | Low |
| 77 | **Smart TV** | Android TV, Apple TV, Samsung Tizen, LG webOS apps | Medium |
| 78 | **Console Apps** | Xbox, PlayStation native or browser support | Low |
| 79 | **Cross-device Sync** | Watch history and preferences synchronized | High |
| 80 | **Handoff** | Continue playback on different device | Medium |

---

## ♿ Accessibility & Inclusion (Phase 9)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 81 | **WCAG 2.1 AA** | Full compliance with accessibility standards | High |
| 82 | **Screen Readers** | Optimized ARIA labels and live regions | High |
| 83 | **Audio Descriptions** | Secondary audio track for visual content | Medium |
| 84 | **Sign Language** | Picture-in-picture sign language overlay | Low |
| 85 | **High Contrast** | Theme options for visual accessibility | High |
| 86 | **Dyslexia Fonts** | OpenDyslexic and similar font options | Medium |
| 87 | **Playback Speed** | 0.25x to 3x speed adjustment | High |
| 88 | **Keyboard Navigation** | Complete keyboard accessibility | High |
| 89 | **Voice Control** | Voice commands for player and navigation | Low |
| 90 | **Reduced Motion** | Disable animations for vestibular disorders | High |
| 91 | **Caption Customization** | Font, size, color, background, position options | High |
| 92 | **Interactive Transcript** | Alongside video with click-to-seek | High |
| 93 | **RTL Support** | Right-to-left languages, Arabic, Hebrew | Medium |
| 94 | **Auto Translation** | Machine translation for descriptions and captions | Medium |
| 95 | **Simplified UI** | Cognitive accessibility mode with reduced complexity | Medium |

---

## 🎮 Gamification & Engagement (Phase 10)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 96 | **Achievements** | Unlockable badges for milestones and activities | Medium |
| 97 | **Watch Streaks** | Daily watching rewards and streak tracking | Medium |
| 98 | **Leaderboards** | Top commenters, contributors, viewers rankings | Low |
| 99 | **XP System** | Points for watching, commenting, sharing | Medium |
| 100 | **Profile Unlocks** | Customizable frames, themes, titles | Low |
| 101 | **Milestones** | Watch time achievements with rewards | Medium |
| 102 | **Referral Program** | Bonuses for inviting new users | Medium |
| 103 | **Seasonal Events** | Time-limited challenges and exclusive content | Low |
| 104 | **Creator Milestones** | Subscriber count celebrations (play buttons) | Medium |
| 105 | **Collectibles** | Optional NFT integration for exclusive moments | Low |
| 106 | **Quizzes** | Interactive quizzes for educational content | Medium |
| 107 | **Predictions** | Live stream predictions and polls | Low |

---

## 🤖 AI & Machine Learning (Phase 11)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 108 | **Content Moderation** | NSFW detection, violence detection, spam filtering | High |
| 109 | **Auto Tagging** | Automatic video categorization and tagging | High |
| 110 | **Smart Thumbnails** | AI selection of optimal thumbnail frames | High |
| 111 | **Video Summaries** | Auto-generated descriptions and summaries | Medium |
| 112 | **Sentiment Analysis** | Comment sentiment monitoring and alerts | Medium |
| 113 | **Toxic Detection** | Automatic hiding of harmful comments | High |
| 114 | **Speaker Diarization** | Who-said-what in transcripts | Medium |
| 115 | **Face Blur** | Automatic face detection and blurring tool | Medium |
| 116 | **Video Upscaling** | AI-powered SD to HD enhancement | Low |
| 117 | **Audio Enhancement** | Noise reduction and audio cleanup | Medium |
| 118 | **Auto Clips** | AI-generated highlights from long-form content | Medium |
| 119 | **Chapter Suggestions** | Auto-detected topic segments | High |
| 120 | **Duplicate Detection** | Plagiarism and re-upload identification | Medium |
| 121 | **Deepfake Detection** | AI manipulation identification | Low |
| 122 | **Voice Cloning Detection** | Synthetic voice identification | Low |

---

## 🏢 Enterprise Features (Phase 12)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 123 | **Multi-tenant** | White-label deployments with complete isolation | High |
| 124 | **SSO Integration** | SAML, OIDC enterprise authentication | High |
| 125 | **Team Management** | Hierarchical organizations with departments | High |
| 126 | **Audit Logs** | Complete activity logging with compliance export | High |
| 127 | **Custom Domains** | Bring-your-own-domain with auto SSL | High |
| 128 | **Enterprise SLA** | Uptime guarantees with support tiers | Medium |
| 129 | **Branded Apps** | White-label mobile applications | Medium |
| 130 | **Private Hosting** | Internal video for corporate training | High |
| 131 | **LMS Integration** | SCORM, xAPI compliance for learning systems | Medium |
| 132 | **Attachments** | PDF, documents alongside videos | Medium |
| 133 | **Certificates** | Completion certificates for courses | Medium |
| 134 | **Assessments** | Quizzes with scoring and tracking | Medium |
| 135 | **SCIM Provisioning** | Automated user management from IdP | Medium |
| 136 | **IP Whitelisting** | Network-based access controls | High |
| 137 | **Custom Metadata** | Enterprise taxonomy and custom fields | Medium |
| 138 | **Bulk User Import** | CSV-based user provisioning | High |
| 139 | **RBAC** | Department and group-based access controls | High |
| 140 | **BI Export** | Analytics export to Tableau, PowerBI | Medium |

---

## 🔴 Live Streaming Advanced (Phase 13)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 141 | **Multi-bitrate Transcoding** | Real-time adaptive bitrate transcoding | High |
| 142 | **Low Latency** | Sub-second latency mode with WebRTC | High |
| 143 | **Ingest Protocols** | RTMP, SRT, WebRTC input support | High |
| 144 | **Go-Live Notifications** | Push notifications when channels go live | High |
| 145 | **Stream Scheduling** | Calendar-based stream scheduling | Medium |
| 146 | **Stream Health** | Real-time bitrate, frame drops monitoring | High |
| 147 | **Failover** | Backup stream auto-switch | Medium |
| 148 | **Multi-camera** | Viewer-selectable camera angles | Low |
| 149 | **Live DVR** | Pause and rewind live content | High |
| 150 | **Clips** | Instant replay clip creation | High |
| 151 | **Interactive** | Polls, Q&A, chat games | Medium |
| 152 | **Raids/Hosts** | Redirect viewers to other streams | Medium |
| 153 | **Co-streaming** | Multiple hosts in single stream | Medium |
| 154 | **Virtual Backgrounds** | Browser-based green screen | Low |
| 155 | **Auto-VOD** | Automatic recording after stream | High |
| 156 | **Highlights** | AI-detected stream highlights | Medium |

---

## 🔐 Security & Compliance (Phase 14)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 157 | **Two-Factor Auth** | TOTP, SMS, hardware key support | High |
| 158 | **Session Management** | Device list with remote logout | High |
| 159 | **Anomaly Detection** | Suspicious login alerts | Medium |
| 160 | **GDPR Tools** | Data export, deletion requests | High |
| 161 | **CCPA Compliance** | California privacy requirements | High |
| 162 | **COPPA Compliance** | Child safety requirements | Medium |
| 163 | **Age Verification** | Mature content gates | High |
| 164 | **Encryption** | At-rest and in-transit encryption | High |
| 165 | **DRM Integration** | Widevine, FairPlay for premium content | Medium |
| 166 | **Watermarking** | Visible and forensic watermarks | Medium |
| 167 | **Bot Detection** | CAPTCHA and behavior analysis | High |
| 168 | **Brute Force Protection** | Progressive rate limiting | High |
| 169 | **API Rate Limiting** | Token bucket algorithm | High |
| 170 | **Security Headers** | HSTS, CSP, X-Frame-Options | High |
| 171 | **Bug Bounty** | Vulnerability disclosure program | Medium |
| 172 | **Penetration Testing** | Regular security assessments | Medium |

---

## 📊 Analytics & Insights (Phase 15)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 173 | **Real-time Viewers** | Live concurrent viewer counts | High |
| 174 | **Demographics** | Age, gender, location (privacy-aware) | Medium |
| 175 | **Engagement Metrics** | Likes, comments, shares tracking | High |
| 176 | **Retention Graphs** | Audience drop-off visualization | High |
| 177 | **Traffic Sources** | Search, browse, external, notifications | High |
| 178 | **Device Analytics** | Platform and device breakdown | Medium |
| 179 | **Revenue Analytics** | Per-video and channel earnings | High |
| 180 | **Subscriber Trends** | Growth and churn analysis | High |
| 181 | **Performance Compare** | Video comparison tools | Medium |
| 182 | **Best Time to Post** | Optimal publish time analysis | Medium |
| 183 | **A/B Results** | Split test performance dashboard | Medium |
| 184 | **Custom Reports** | Report builder with scheduling | Medium |
| 185 | **Live Dashboard** | Real-time stream analytics | High |
| 186 | **External Export** | Google Analytics, Mixpanel integration | Medium |
| 187 | **Funnel Analysis** | Discovery to purchase conversion | Medium |
| 188 | **Cohort Analysis** | User retention over time | Medium |

---

## 📋 Content Management (Phase 16)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 189 | **Bulk Operations** | Mass publish, unpublish, delete, tag | High |
| 190 | **Approval Workflows** | Multi-stage content review | Medium |
| 191 | **Content Expiry** | Scheduled unpublish and archival | Medium |
| 192 | **Version Control** | Content versioning with rollback | Medium |
| 193 | **Auto Scanning** | Policy violation detection | High |
| 194 | **Strike System** | Escalating penalties for violations | High |
| 195 | **Appeals** | User appeal workflow for decisions | High |
| 196 | **Trusted Flaggers** | Community moderation program | Medium |
| 197 | **Comment Filters** | Automated comment moderation | High |
| 198 | **Blocklist** | Word, phrase, link blocking | High |
| 199 | **Report Queue** | Prioritized user reports | High |
| 200 | **Action Templates** | Consistent moderation responses | Medium |
| 201 | **Platform Sync** | YouTube, Vimeo import | Medium |
| 202 | **RSS Feeds** | Podcast and video feed generation | Medium |

---

## 👨‍💻 Developer & API (Phase 17)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 203 | **REST API** | RESTful API alongside tRPC | High |
| 204 | **GraphQL** | Flexible query endpoint | Medium |
| 205 | **Webhooks** | Event notifications with retry | High |
| 206 | **OAuth2 Provider** | Third-party app authorization | Medium |
| 207 | **Embed SDK** | Customizable player embed | High |
| 208 | **Player API** | JavaScript player controls | High |
| 209 | **Upload SDK** | Third-party upload integration | Medium |
| 210 | **Usage Dashboard** | API quota monitoring | High |
| 211 | **Dev Portal** | Interactive documentation | High |
| 212 | **Language SDKs** | JS, Python, Go, Ruby clients | Medium |
| 213 | **API Collections** | Postman, Insomnia templates | Medium |
| 214 | **OpenAPI Spec** | Swagger documentation | High |
| 215 | **Sandbox** | Development environment | Medium |
| 216 | **Versioning** | API version management | High |

---

## ⚡ Performance & Optimization (Phase 18)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 217 | **Edge Caching** | CDN integration with invalidation | High |
| 218 | **Lazy Loading** | Deferred asset loading | High |
| 219 | **Image Optimization** | WebP/AVIF conversion | High |
| 220 | **Preview Thumbnails** | Animated hover previews | Medium |
| 221 | **Skeleton Loading** | Perceived performance UI | High |
| 222 | **Service Workers** | Offline support and caching | High |
| 223 | **Query Optimization** | Database performance tuning | High |
| 224 | **Connection Pooling** | Efficient database connections | High |
| 225 | **Horizontal Scaling** | Stateless service scaling | High |
| 226 | **Auto-scaling** | Load-based resource scaling | Medium |
| 227 | **Multi-region** | Geographic distribution | Medium |
| 228 | **Blue-Green Deploy** | Zero-downtime deployments | High |
| 229 | **Canary Releases** | Gradual rollout mechanism | Medium |
| 230 | **Performance Budget** | Lighthouse CI integration | High |
| 231 | **RUM** | Real user monitoring | Medium |
| 232 | **Synthetic Monitoring** | Uptime and performance checks | High |

---

## 🗄️ Data Models & Schema

### Complete Entity Definitions

#### User Entity
```typescript
interface User {
  id: string;                      // UUID primary key
  email: string;                   // Unique, indexed
  emailVerified: boolean;
  username: string;                // Unique, 3-30 chars, alphanumeric
  displayName: string;             // 1-50 chars
  avatar?: string;                 // URL to avatar image
  bio?: string;                    // Max 500 chars
  
  // Authentication
  passwordHash?: string;           // bcrypt hash (null for OAuth-only)
  providers: AuthProvider[];       // Linked OAuth providers
  
  // Roles & Permissions
  role: 'admin' | 'creator' | 'viewer';
  permissions: string[];           // Granular permissions
  
  // Settings
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;              // ISO language code
    notifications: NotificationPrefs;
    privacy: PrivacySettings;
    playback: PlaybackPrefs;
  };
  
  // Status
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  suspendedUntil?: Date;
  banReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
}

interface AuthProvider {
  provider: 'google' | 'github' | 'discord' | 'twitter' | 'apple';
  providerId: string;
  email?: string;
  connectedAt: Date;
}
```

#### Channel Entity
```typescript
interface Channel {
  id: string;                      // UUID primary key
  ownerId: string;                 // FK to User
  
  // Identity
  name: string;                    // Display name, 1-100 chars
  slug: string;                    // URL slug, unique, 3-50 chars
  description?: string;            // Max 5000 chars, markdown
  
  // Branding
  avatar?: string;                 // Square image URL
  banner?: string;                 // Wide banner URL (16:9)
  accentColor?: string;            // Hex color code
  
  // Configuration
  visibility: 'public' | 'unlisted' | 'private';
  allowComments: boolean;
  commentModeration: 'all' | 'hold_links' | 'hold_new' | 'none';
  
  // Features
  featuredVideoId?: string;        // FK to Asset
  trailerVideoId?: string;         // FK to Asset
  sections: ChannelSection[];
  links: SocialLink[];
  
  // Stats (denormalized for performance)
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  
  // Monetization
  monetizationEnabled: boolean;
  stripeConnectedAccountId?: string;
  subscriptionTiers: SubscriptionTier[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;               // Verification timestamp
}
```

#### Asset (Video) Entity
```typescript
interface Asset {
  id: string;                      // UUID primary key
  channelId: string;               // FK to Channel
  
  // Content Info
  title: string;                   // 1-100 chars
  description?: string;            // Max 5000 chars, markdown
  
  // Source
  sourceType: 'upload' | 'embed';
  embedUrl?: string;               // For external embeds
  embedPlatform?: 'youtube' | 'vimeo' | 'twitch' | 'archive';
  
  // Storage (for uploads)
  originalFilename?: string;
  originalFileSize?: number;       // Bytes
  masterStoragePath?: string;      // Raw file path in object store
  
  // Processed Media
  hlsManifestUrl?: string;         // HLS master playlist
  dashManifestUrl?: string;        // DASH MPD
  renditions: Rendition[];
  thumbnails: Thumbnail[];
  captions: CaptionTrack[];
  chapters: Chapter[];
  
  // Metadata
  duration: number;                // Seconds
  resolution: { width: number; height: number };
  frameRate: number;
  codec: string;
  
  // Classification
  tags: string[];
  category?: string;
  language?: string;               // ISO code
  license: LicenseType;
  contentRating: 'G' | 'PG' | 'PG13' | 'R' | 'NC17';
  
  // Visibility
  visibility: 'public' | 'unlisted' | 'private' | 'members';
  scheduledPublishAt?: Date;
  premieresAt?: Date;
  
  // Access Control
  requiresSubscription: boolean;
  minimumTier?: string;            // Subscription tier ID
  
  // Processing
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress: number;      // 0-100
  processingError?: string;
  
  // Stats (denormalized)
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'taken_down';
  moderationNotes?: string;
}

interface Rendition {
  quality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
  width: number;
  height: number;
  bitrate: number;                 // kbps
  codec: string;
  storagePath: string;
}

interface Thumbnail {
  size: 'small' | 'medium' | 'large' | 'maxres';
  width: number;
  height: number;
  url: string;
}

interface CaptionTrack {
  id: string;
  language: string;                // ISO code
  label: string;                   // Display name
  url: string;                     // WebVTT file URL
  isAutoGenerated: boolean;
  isDefault: boolean;
}

interface Chapter {
  title: string;
  startTime: number;               // Seconds
  endTime: number;
  thumbnail?: string;
}
```

#### Transcode Job Entity
```typescript
interface TranscodeJob {
  id: string;
  assetId: string;                 // FK to Asset
  
  // Configuration
  inputPath: string;               // Source file in object store
  outputPrefix: string;            // Output path prefix
  targetProfiles: TranscodeProfile[];
  
  // Progress
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;                // 0-100
  currentStep: string;             // Current processing step
  
  // Results
  outputs: TranscodeOutput[];
  
  // Errors
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  retryCount: number;
  maxRetries: number;
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  workerNode?: string;             // Which worker processed this
  ffmpegCommand?: string;          // For debugging
  logs: string[];                  // Processing logs
}

interface TranscodeProfile {
  name: string;
  resolution: { width: number; height: number };
  bitrate: number;
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  audioCodec: 'aac' | 'opus';
  audioBitrate: number;
}

interface TranscodeOutput {
  profile: string;
  storagePath: string;
  fileSize: number;
  duration: number;
}
```

---

## 🔌 API Contracts

### tRPC Router Structure

```typescript
// Root router combining all sub-routers
const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  upload: uploadRouter,
  player: playerRouter,
  channel: channelRouter,
  comment: commentRouter,
  moderation: moderationRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
  integration: integrationRouter,
  live: liveRouter,
});
```

### Detailed Procedure Definitions

#### Authentication Router
```typescript
const authRouter = router({
  // Registration
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      username: z.string().min(3).max(30),
      displayName: z.string().min(1).max(50),
    }))
    .mutation(async ({ input }) => {
      // Create user, send verification email
      return { userId: string, requiresVerification: boolean };
    }),

  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      rememberMe: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return { 
        user: UserPublic,
        session: SessionInfo,
        requiresTwoFactor: boolean,
      };
    }),

  // Two-factor verification
  verifyTwoFactor: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      return { user: UserPublic, session: SessionInfo };
    }),

  // OAuth
  getOAuthUrl: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'github', 'discord', 'twitter', 'apple']),
      redirectUri: z.string().url(),
    }))
    .query(async ({ input }) => {
      return { authUrl: string };
    }),

  handleOAuthCallback: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'github', 'discord', 'twitter', 'apple']),
      code: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { user: UserPublic, session: SessionInfo, isNewUser: boolean };
    }),

  // Session management
  getSession: protectedProcedure
    .query(async ({ ctx }) => {
      return { user: UserPublic, session: SessionInfo };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: boolean };
    }),

  logoutAllDevices: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { devicesLoggedOut: number };
    }),

  // Password management
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return { success: boolean };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      return { success: boolean };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      return { success: boolean };
    }),

  // Profile
  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(50).optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return { user: UserPublic };
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().optional(),
      notifications: NotificationPrefsSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return { settings: UserSettings };
    }),
});
```

#### Upload Router
```typescript
const uploadRouter = router({
  // Create asset metadata
  createAsset: creatorProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(5000).optional(),
      channelId: z.string().uuid(),
      visibility: z.enum(['public', 'unlisted', 'private', 'members']),
      tags: z.array(z.string()).max(30),
      category: z.string().optional(),
      license: LicenseTypeSchema,
      scheduledPublishAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return { 
        assetId: string,
        status: 'pending_upload',
      };
    }),

  // Request pre-signed upload URL
  requestUploadUrl: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
      filename: z.string(),
      fileSize: z.number().max(10 * 1024 * 1024 * 1024), // 10GB max
      contentType: z.string(),
      checksum: z.string().optional(), // MD5 for integrity
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        uploadUrl: string,          // Pre-signed PUT URL
        uploadId: string,           // For multipart
        expiresAt: Date,            // URL expiration
        fields: Record<string, string>, // Additional form fields
      };
    }),

  // For multipart uploads - get part URLs
  getMultipartUrls: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
      uploadId: z.string(),
      partNumbers: z.array(z.number()),
    }))
    .query(async ({ ctx, input }) => {
      return {
        parts: Array<{ partNumber: number; uploadUrl: string }>,
      };
    }),

  // Complete multipart upload
  completeMultipart: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
      uploadId: z.string(),
      parts: z.array(z.object({
        partNumber: z.number(),
        etag: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return { success: boolean };
    }),

  // Finalize upload and start processing
  finalizeUpload: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        assetId: string,
        status: 'processing',
        transcodeJobId: string,
      };
    }),

  // Check upload/processing status
  getStatus: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        assetId: string,
        status: 'pending_upload' | 'uploading' | 'processing' | 'completed' | 'failed',
        progress: number,           // 0-100
        currentStep: string,
        estimatedTimeRemaining: number, // seconds
        error: string | null,
      };
    }),

  // Update asset metadata
  updateMetadata: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).max(30).optional(),
      visibility: z.enum(['public', 'unlisted', 'private', 'members']).optional(),
      // ... other fields
    }))
    .mutation(async ({ ctx, input }) => {
      return { asset: AssetPublic };
    }),

  // Delete asset
  deleteAsset: creatorProcedure
    .input(z.object({
      assetId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return { success: boolean };
    }),
});
```

---

## 🔒 Security & Compliance

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ EDGE LAYER (CDN/WAF)                                            │    │
│  │ • DDoS protection        • Bot detection                        │    │
│  │ • Geo-blocking           • Rate limiting (L7)                   │    │
│  │ • TLS termination        • OWASP ruleset                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐    │
│  │ APPLICATION LAYER                                               │    │
│  │ • Input validation       • CSRF protection                      │    │
│  │ • XSS prevention         • SQL injection prevention             │    │
│  │ • Rate limiting          • Request signing                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐    │
│  │ AUTHENTICATION LAYER                                            │    │
│  │ • Session management     • OAuth 2.0 / OIDC                     │    │
│  │ • JWT validation         • Two-factor auth                      │    │
│  │ • Password hashing       • Rate limiting per user               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐    │
│  │ AUTHORIZATION LAYER                                             │    │
│  │ • Role-based access      • Resource ownership                   │    │
│  │ • Permission checks      • Subscription validation              │    │
│  │ • Scope verification     • Content visibility                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐    │
│  │ DATA LAYER                                                      │    │
│  │ • Encryption at rest     • Prepared statements                  │    │
│  │ • Field-level encryption • Audit logging                        │    │
│  │ • Secure key storage     • Backup encryption                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security Headers Configuration

```typescript
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.cinevault.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.cinevault.io wss://api.cinevault.io",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Other security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};
```

### Compliance Checklist

| Regulation | Requirements | Implementation |
|------------|--------------|----------------|
| **GDPR** | Data export, deletion, consent | Profile settings, API endpoints |
| **CCPA** | Do not sell, disclosure | Privacy settings, notices |
| **COPPA** | Parental consent, data limits | Age gates, restricted features |
| **DMCA** | Takedown process, safe harbor | Moderation workflow, notices |
| **ADA** | Accessibility | WCAG 2.1 AA compliance |
| **PCI-DSS** | Payment security | External payment processor (Stripe) |

---

## 🏗️ Infrastructure & DevOps

### Docker Compose (Development)

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: cinevault-db
    environment:
      POSTGRES_USER: cinevault
      POSTGRES_PASSWORD: ${DB_PASSWORD:-development}
      POSTGRES_DB: cinevault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cinevault"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: cinevault-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: cinevault-storage
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"    # API
      - "9001:9001"    # Console
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Web Application
  web:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.web
    container_name: cinevault-web
    environment:
      - DATABASE_URL=postgresql://cinevault:${DB_PASSWORD:-development}@postgres:5432/cinevault
      - REDIS_URL=redis://redis:6379
      - OBJECT_STORE_URL=http://minio:9000
      - OBJECT_STORE_ACCESS_KEY=${MINIO_ROOT_USER:-minioadmin}
      - OBJECT_STORE_SECRET_KEY=${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy

  # Transcode Worker
  worker:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.worker
    container_name: cinevault-worker
    environment:
      - DATABASE_URL=postgresql://cinevault:${DB_PASSWORD:-development}@postgres:5432/cinevault
      - REDIS_URL=redis://redis:6379
      - OBJECT_STORE_URL=http://minio:9000
      - OBJECT_STORE_ACCESS_KEY=${MINIO_ROOT_USER:-minioadmin}
      - OBJECT_STORE_SECRET_KEY=${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - worker_temp:/tmp/transcode
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  minio_data:
  worker_temp:
```

### Environment Variables

```bash
# .env.example

# ======================
# APPLICATION
# ======================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ======================
# DATABASE
# ======================
DATABASE_URL=postgresql://cinevault:development@localhost:5432/cinevault
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ======================
# REDIS
# ======================
REDIS_URL=redis://localhost:6379

# ======================
# OBJECT STORAGE
# ======================
OBJECT_STORE_URL=http://localhost:9000
OBJECT_STORE_BUCKET=cinevault
OBJECT_STORE_ACCESS_KEY=minioadmin
OBJECT_STORE_SECRET_KEY=minioadmin
OBJECT_STORE_REGION=us-east-1

# ======================
# CDN (Production)
# ======================
CDN_URL=https://cdn.example.com
CDN_SIGNING_KEY=your-cdn-signing-key

# ======================
# AUTHENTICATION
# ======================
BETTER_AUTH_SECRET=your-256-bit-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# ======================
# EMAIL
# ======================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@example.com

# ======================
# TRANSCODING
# ======================
FFMPEG_PATH=/usr/bin/ffmpeg
TRANSCODE_CONCURRENCY=2
TRANSCODE_TIMEOUT=3600

# ======================
# SECURITY
# ======================
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
CORS_ORIGINS=http://localhost:3000

# ======================
# OBSERVABILITY
# ======================
LOG_LEVEL=debug
SENTRY_DSN=
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
                    ┌─────────────┐
                    │    E2E      │ ← Playwright, critical paths
                   ╱│   Tests    │╲   (~10% of tests)
                  ╱ └─────────────┘ ╲
                 ╱                   ╲
                ╱  ┌─────────────────┐ ╲
               ╱   │  Integration    │  ╲ ← tRPC routes, DB
              ╱    │    Tests        │   ╲  (~30% of tests)
             ╱     └─────────────────┘    ╲
            ╱                              ╲
           ╱  ┌───────────────────────────┐ ╲
          ╱   │       Unit Tests          │  ╲ ← Business logic
         ╱    │   (Vitest/Jest)           │   ╲  (~60% of tests)
        ╱     └───────────────────────────┘    ╲
       └────────────────────────────────────────┘
```

### Test Commands

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:ci": "turbo run test:unit test:integration && playwright test"
  }
}
```

---

## 📅 Roadmap & Milestones

### Development Timeline

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|--------------|
| **Week 0** | Planning | Architecture | Schema, API contracts, monorepo setup |
| **Week 1-2** | MVP Core | Auth + Upload | User system, upload flow, basic player |
| **Week 3-4** | MVP Complete | Catalog + Admin | Search, moderation, Docker compose |
| **Week 5-6** | Phase 2 | Engagement | Comments, subscriptions, OAuth |
| **Week 7-8** | Phase 3 | Advanced | Live streaming basics, plugin system |
| **Month 3+** | Scale | Enterprise | Multi-tenant, enterprise auth, compliance |

### MVP Definition of Done

- [ ] User can register, login, and manage profile
- [ ] Creator can upload video with metadata
- [ ] Uploaded video is transcoded to HLS with multiple qualities
- [ ] Viewer can browse catalog and search for videos
- [ ] Viewer can watch video with quality selection and captions
- [ ] Admin can moderate flagged content
- [ ] Local development works with single `docker compose up`
- [ ] CI pipeline passes all tests
- [ ] Core user flows have E2E test coverage
- [ ] Documentation covers setup and basic usage

---

## 📜 Legal & Policy Documents

### Required Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **LICENSE** | Open source license (MIT) | `/LICENSE` |
| **CONTRIBUTING.md** | Contribution guidelines | `/CONTRIBUTING.md` |
| **CODE_OF_CONDUCT.md** | Community standards | `/CODE_OF_CONDUCT.md` |
| **SECURITY.md** | Vulnerability reporting | `/SECURITY.md` |
| **PRIVACY_POLICY.md** | Data handling | `/docs/PRIVACY_POLICY.md` |
| **TERMS_OF_SERVICE.md** | Usage terms | `/docs/TERMS_OF_SERVICE.md` |
| **ACCEPTABLE_USE.md** | Content policy | `/docs/ACCEPTABLE_USE.md` |
| **DMCA_POLICY.md** | Takedown process | `/docs/DMCA_POLICY.md` |

---

## 📚 Appendix

### Reference Links

| Resource | URL |
|----------|-----|
| Next.js App Router | https://nextjs.org/docs/app |
| tRPC Documentation | https://trpc.io/docs |
| Drizzle ORM | https://orm.drizzle.team |
| Better-Auth | https://better-auth.com |
| HLS.js Player | https://github.com/video-dev/hls.js |
| FFmpeg Documentation | https://ffmpeg.org/documentation.html |
| Turborepo | https://turbo.build/repo/docs |

### Glossary

| Term | Definition |
|------|------------|
| **Asset** | A video or media item in the catalog |
| **Channel** | A creator's content collection and identity |
| **HLS** | HTTP Live Streaming, adaptive bitrate protocol |
| **Manifest** | Playlist file describing available video qualities |
| **Rendition** | A specific quality version of a video |
| **Transcode** | Convert video to different formats/qualities |
| **Pre-signed URL** | Temporary, authenticated URL for direct uploads |

---

*This document is a living specification. Last updated: December 8, 2024*