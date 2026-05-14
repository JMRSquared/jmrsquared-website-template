#!/usr/bin/env bash
# init-gkm-and-beads.sh
#
# Usage:
#   ./init-gkm-and-beads.sh --name my-app [--frontend nextjs|tanstack-start|expo]
#                             [--db true|false] [--cache true|false]
#                             [--mailer console|mailpit]
#                             [--logger pino|console]
#                             [--pkg-manager pnpm|npm|yarn|bun]
#                             [--provider claude|codex|cursor|cursor-provider|pi]
#                             [--vsc] [--warp] [--skip-install]
#
# This script scaffolds a new monorepo wired for @geekmidas/toolbox runtime
# (apps/api + apps/web|app + packages/*), then installs beads + pi agents,
# repo-local skills from technanimals/geekmidas-skills, and per-provider
# (claude/codex/cursor/pi) agent config.
#
# Prerequisites:
#   npm/pnpm/yarn/bun + Docker running for PostgreSQL/Redis/Mailpit.
#   For --provider claude/codex/cursor/pi — the respective CLI must be installed.
#
# Make globally available:
#   cp init-gkm-and-beads.sh ~/.local/bin/init-gkm-and-beads && chmod +x ~/.local/bin/init-gkm-and-beads

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
PROJECT_NAME=""
FRONTEND="nextjs"          # nextjs | tanstack-start | expo
DB="true"
CACHE="true"
MAILER="console"           # console | mailpit
LOGGER="pino"              # pino | console
PKG_MANAGER="pnpm"         # pnpm | npm | yarn | bun
PROVIDER=""                # claude | codex | cursor | cursor-provider | pi
VSC=false
WARP=false
SKIP_INSTALL=false

# ── Argument parsing ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --name)        PROJECT_NAME="$2";  shift 2 ;;
    --frontend)     FRONTEND="$2";     shift 2 ;;
    --db)           DB="$2";            shift 2 ;;
    --cache)        CACHE="$2";         shift 2 ;;
    --mailer)       MAILER="$2";        shift 2 ;;
    --logger)       LOGGER="$2";         shift 2 ;;
    --pkg-manager)  PKG_MANAGER="$2";   shift 2 ;;
    --provider)     PROVIDER="$2";       shift 2 ;;
    --vsc)          VSC=true;           shift ;;
    --warp)         WARP=true;          shift ;;
    --skip-install) SKIP_INSTALL=true;   shift ;;
    -h|--help)
      cat <<HELP
Usage: $0 --name my-app [options]

Options:
  --name         Project name (required, npm-safe: alphanumeric + hyphens)
  --frontend     nextjs (default) | tanstack-start | expo
  --db           true (default) | false
  --cache        true (default) | false
  --mailer       console (default) | mailpit
  --logger       pino (default) | console
  --pkg-manager  pnpm (default) | npm | yarn | bun
  --provider     claude | codex | cursor | cursor-provider | pi
  --vsc          Generate .vscode/tasks.json
  --warp         Generate Warp launch configuration
  --skip-install Skip dependency installation (for CI)
  --help         Show this help

Examples:
  $0 --name my-api --frontend nextjs --provider claude --vsc
  $0 --name mobile-app --frontend expo --provider cursor
  $0 --name minimal-api --db false --cache false
HELP
      exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1 ;;
  esac
done

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: --name is required" >&2
  exit 1
fi

if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Error: --name must be npm-safe (alphanumeric + hyphens, starts with letter/number)" >&2
  exit 1
fi

for _reserved in node_modules .git package.json src; do
  if [[ "$PROJECT_NAME" == "$_reserved" ]]; then
    echo "Error: '$PROJECT_NAME' is a reserved name" >&2
    exit 1
  fi
done

PROJECT_ROOT="$(pwd)/$PROJECT_NAME"
if [[ -d "$PROJECT_ROOT" ]]; then
  echo "Error: directory '$PROJECT_ROOT' already exists" >&2
  exit 1
fi

SUPPORTED_PKGS="pnpm npm yarn bun"
if [[ ! " $SUPPORTED_PKGS " =~ " $PKG_MANAGER " ]]; then
  echo "Error: --pkg-manager must be one of: $SUPPORTED_PKGS" >&2
  exit 1
fi

SUPPORTED_FRONTENDS="nextjs tanstack-start expo"
if [[ ! " $SUPPORTED_FRONTENDS " =~ " $FRONTEND " ]]; then
  echo "Error: --frontend must be one of: $SUPPORTED_FRONTENDS" >&2
  exit 1
fi

# ── Helper functions ──────────────────────────────────────────────────────────
_random_password() {
  node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
}

# ── Step 1: Scaffold via gkm fullstack-init ───────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1 — Scaffolding project '$PROJECT_NAME' with @geekmidas/toolbox"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Generate DB credentials
API_DB_PASSWORD=$(_random_password)
AUTH_DB_PASSWORD=$(_random_password)
JWT_SECRET=$(_random_password)
BETTER_AUTH_SECRET=$(_random_password)

# ── Root monorepo files ────────────────────────────────────────────────────────
cat > package.json <<EOF
{
  "name": "$PROJECT_NAME",
  "version": "0.1.0",
  "private": true,
  "packageManager": "$PKG_MANAGER@latest",
  "scripts": {
    "dev": "$PKG_MANAGER --filter $PROJECT_NAME-workspace exec $PKG_MANAGER run dev",
    "build": "turbo build",
    "test": "vitest",
    "lint": "biome lint .",
    "fmt": "biome format . --write",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
EOF

cat > pnpm-workspace.yaml <<EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
EOF

cat > vitest.config.ts <<EOF
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist']
  }
})
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "lint": { "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] }
  }
}
EOF

cat > biome.json <<EOF
{
  "\$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "javascript": {
    "formatter": { "indentStyle": "space", "indentWidth": 2, "quoteStyle": "single", "semicolons": true }
  },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "enabled": true }
}
EOF

cat > .gitignore <<EOF
node_modules/
dist/
.turbo/
.env
.env.local
.gkm/
*.tsbuildinfo
.DS_Store
coverage/
EOF

# ── gkm.config.ts ─────────────────────────────────────────────────────────────
cat > gkm.config.ts <<EOF
import { defineWorkspace } from '@geekmidas/cli/config'

export default defineWorkspace({
  name: '$PROJECT_NAME',
  apps: {
    api: {
      path: 'apps/api',
      type: 'backend',
      port: 3000,
      routes: './src/endpoints/**/*.ts',
      envParser: './src/config/env',
      logger: './src/config/logger',
      telescope: true,
    },
    auth: {
      type: 'auth',
      path: 'apps/auth',
      port: 3002,
      provider: 'better-auth',
      entry: './src/index.ts',
      requiredEnv: ['DATABASE_URL', 'BETTER_AUTH_SECRET'],
    },
EOF

if [[ "$FRONTEND" == "expo" ]]; then
cat >> gkm.config.ts <<'EOF'
    app: {
      type: 'frontend',
      path: 'apps/app',
      port: 8081,
      framework: 'expo',
      dependencies: ['api', 'auth'],
    },
EOF
else
cat >> gkm.config.ts <<'EOF'
    web: {
      type: 'frontend',
      path: 'apps/web',
      port: 3001,
      framework: '$FRONTEND',
      dependencies: ['api', 'auth'],
    },
EOF
fi

cat >> gkm.config.ts <<EOF
  },
  services: {
    db: $DB,
    cache: $CACHE,
  },
})
EOF

# ── packages/models ──────────────────────────────────────────────────────────
mkdir -p packages/models/src
cat > packages/models/package.json <<EOF
{
  "name": "@$PROJECT_NAME/models",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": { "zod": "^3.23.0" },
  "devDependencies": { "typescript": "^5.5.0" }
}
EOF

cat > packages/models/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"]
}
EOF

cat > packages/models/src/common.ts <<'EOF'
import { z } from 'zod'

export const IdSchema = z.string().ulid()
export const IdParamsSchema = z.object({ id: IdSchema })

export const TimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type Pagination = z.infer<typeof PaginationSchema>

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    hasMore: z.boolean(),
  })
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<z.ZodType>>>
EOF

cat > packages/models/src/user.ts <<'EOF'
import { z } from 'zod'
import { IdSchema, TimestampsSchema } from './common.js'

export const UserSchema = z.object({
  id: IdSchema,
  email: z.string().email(),
  name: z.string().min(1).optional(),
  image: z.string().url().optional(),
  role: z.enum(['admin', 'user']).default('user'),
  emailVerified: z.boolean().default(false),
}).merge(TimestampsSchema)
export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
})
export type CreateUser = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().optional(),
})
export type UpdateUser = z.infer<typeof UpdateUserSchema>

export const UserResponseSchema = UserSchema.omit({ emailVerified: true })
export type UserResponse = z.infer<typeof UserResponseSchema>
EOF

cat > packages/models/src/index.ts <<'EOF'
export * from './common.js'
export * from './user.js'
EOF

# ── packages/ui ───────────────────────────────────────────────────────────────
mkdir -p packages/ui/src/components packages/ui/src/lib packages/ui/src/styles
cat > packages/ui/package.json <<'EOF'
{
  "name": "@$PROJECT_NAME/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.400.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0"
  }
}
EOF

cat > packages/ui/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist", "jsx": "react-jsx", "baseUrl": ".", "paths": { "~/*": ["./src/*"] } },
  "include": ["src/**/*"]
}
EOF

cat > packages/ui/tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        muted: 'hsl(var(--muted))',
        destructive: 'hsl(var(--destructive))',
      },
      borderRadius: 'var(--radius)',
    },
  },
  plugins: [],
} satisfies Config
EOF

cat > packages/ui/src/lib/utils.ts <<'EOF'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

cat > packages/ui/src/styles/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --secondary: 210 40% 96%;
    --accent: 210 40% 96%;
    --muted: 210 40% 96%;
    --destructive: 0 84% 60%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 7%;
    --foreground: 210 40% 98%;
  }
}
EOF

cat > packages/ui/src/index.ts <<'EOF'
export { cn } from './lib/utils.js'
export * from './components/*.tsx'
EOF

cat > packages/ui/components.json <<'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": { "components": "~/components", "utils": "~/lib/utils" }
}
EOF

# ── apps/api ──────────────────────────────────────────────────────────────────
mkdir -p apps/api/src/config apps/api/src/services apps/api/src/endpoints/users apps/api/src/test/fixtures
cat > apps/api/package.json <<EOF
{
  "name": "@$PROJECT_NAME/api",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "dev": "gkm dev",
    "build": "gkm build",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "@geekmidas/constructs": "^3.0.0",
    "@geekmidas/services": "^1.0.0",
    "@geekmidas/envkit": "^1.0.0",
    "@geekmidas/auth": "^1.0.0",
    "@geekmidas/telescope": "^1.0.0",
    "@geekmidas/studio": "^1.0.0",
    "@geekmidas/audit": "^1.0.0",
    "@geekmidas/rate-limit": "^1.0.0",
    "@$PROJECT_NAME/models": "workspace:*",
    "hono": "^4.8.0",
    "kysely": "^0.27.0",
    "pg": "^8.12.0",
    "$( [[ '$LOGGER' == 'pino' ]] && echo 'pino: ^9.0.0' || echo 'console' )": null,
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
EOF

# Fix the logger entry (can't use ternary in heredoc easily)
if [[ "$LOGGER" == "pino" ]]; then
  sed -i '' 's/"\$\( \[\[ .* ]].*echo.*pino.*\)"/"pino: ^9.0.0"/' apps/api/package.json 2>/dev/null || true
fi

cat > apps/api/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist", "baseUrl": ".", "paths": { "~/*": ["./src/*"], "@$PROJECT_NAME/models": ["../../packages/models/src/index.ts"] } },
  "include": ["src/**/*"]
}
EOF

cat > apps/api/gkm.config.ts <<'EOF'
// gkm config — loaded by the gkm CLI
export { }
EOF

cat > apps/api/src/config/env.ts <<'EOF'
import { EnvironmentParser, z } from '@geekmidas/envkit'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  AUTH_SERVICE_URL: z.string().url().optional(),
})

export const env = EnvironmentParser.parse(EnvSchema, {
  database: { url: process.env.DATABASE_URL },
  cache: { url: process.env.REDIS_URL },
})
EOF

cat > apps/api/src/config/logger.ts <<EOF
import { createLogger } from '@geekmidas/logger'

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'debug',
  $( [[ "$LOGGER" == "pino" ]] && echo "driver: 'pino'" || echo "driver: 'console'" ),
})
EOF

cat > apps/api/src/config/telescope.ts <<'EOF'
import { telescope } from '@geekmidas/telescope'

// Telescope — request debugging dashboard
// Access at: http://localhost:3000/telescope
export { telescope }
EOF

cat > apps/api/src/config/studio.ts <<'EOF'
import { studio } from '@geekmidas/studio'

// Studio — database browser (requires database service)
export { studio }
EOF

cat > apps/api/src/services/database.ts <<'EOF'
import { Kysely } from 'kysely'
import { PgDialect } from 'kysely/pg'

export interface Database {
  users: {
    id: string
    email: string
    name: string | null
    image: string | null
    role: 'admin' | 'user'
    emailVerified: boolean
    createdAt: string
    updatedAt: string
  }
}

export const db = new Kysely<Database>({
  dialect: new PgDialect({
    pool: {
      connectionString: process.env.DATABASE_URL!,
      max: 10,
    },
  }),
})
EOF

cat > apps/api/src/services/auth.ts <<'EOF'
import { authServiceClient } from '@geekmidas/services'

export const authClient = authServiceClient({
  baseUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3002',
})
EOF

cat > apps/api/src/router.ts <<'EOF'
import { EndpointFactory } from '@geekmidas/constructs'
import { z } from 'zod'
import { env } from './config/env.js'

// Default JWT authorizer — verify token from Authorization: Bearer header
const defaultAuthorizer = async (token: string) => {
  const { verifyJWT } = await import('@geekmidas/auth')
  return verifyJWT(token, env.JWT_SECRET)
}

export const e = new EndpointFactory({
  authorizer: defaultAuthorizer,
  schemas: {
    params: z.object({ id: z.string().ulid() }),
    query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }),
  },
})
EOF

cat > apps/api/src/endpoints/health.ts <<'EOF'
import { e } from '../router.js'

export const health = e.get('/health', async (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})
EOF

mkdir -p apps/api/src/endpoints/users
cat > apps/api/src/endpoints/users/list.ts <<'EOF'
import { e, db } from '../../router.js'

export const listUsers = e.get('/users', async (c) => {
  const { page, limit } = c.req.valid('query')
  const offset = (page - 1) * limit

  const [rows, { count }] = await Promise.all([
    db.selectFrom('users').select(['id', 'email', 'name', 'image', 'role', 'createdAt']).limit(limit).offset(offset).execute(),
    db.selectFrom('users').select((eb) => eb.fn.countAll().as('count')).executeTakeFirst(),
  ])

  return c.json({
    items: rows,
    total: Number(count),
    page,
    limit,
    hasMore: offset + rows.length < Number(count),
  })
})
EOF

cat > apps/api/src/endpoints/users/get.ts <<'EOF'
import { e, db } from '../../router.js'

export const getUser = e.get('/users/:id', async (c) => {
  const { id } = c.req.valid('params')
  const user = await db.selectFrom('users').select(['id', 'email', 'name', 'image', 'role', 'emailVerified', 'createdAt', 'updatedAt']).where('id', '=', id).executeTakeFirst()
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json(user)
})
EOF

cat > apps/api/src/endpoints/profile.ts <<'EOF'
import { e } from '../router.js'

export const profile = e.get('/profile', { auth: true }, async (c) => {
  const session = c.get('session')
  // session.userId, session.role available
  return c.json({ userId: session.userId, role: session.role })
})
EOF

# ── apps/auth ──────────────────────────────────────────────────────────────────
mkdir -p apps/auth/src/config
cat > apps/auth/package.json <<EOF
{
  "name": "@$PROJECT_NAME/auth",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "dev": "gkm dev --entry ./src/index.ts",
    "db:migrate": "npx @better-auth/cli migrate",
    "db:generate": "npx @better-auth/cli generate",
    "build": "tsc --noEmit",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "better-auth": "^1.0.0",
    "hono": "^4.8.0",
    "@hono/node-server": "^2.12.0",
    "kysely": "^0.27.0",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
EOF

cat > apps/auth/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist", "baseUrl": ".", "paths": { "~/*": ["./src/*"] } },
  "include": ["src/**/*"]
}
EOF

cat > apps/auth/src/config/env.ts <<'EOF'
export const authEnv = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://auth:CHANGE_ME@localhost:5432/'$PROJECT_NAME'_dev?search_path=auth',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3002',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? '',
  TRUSTED_ORIGINS: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001').split(','),
}
EOF

cat > apps/auth/src/config/logger.ts <<'EOF'
export const authLogger = console
EOF

cat > apps/auth/src/auth.ts <<'EOF'
import { betterAuth } from 'better-auth'
import { pgAdapter } from 'better-auth/adapters/pg'
import { Pool } from 'pg'
import { authEnv } from './config/env.js'

const pool = new Pool({ connectionString: authEnv.DATABASE_URL })

export const auth = betterAuth({
  database: pgAdapter(pool),
  baseURL: authEnv.BETTER_AUTH_URL,
  trustedOrigins: authEnv.TRUSTED_ORIGINS,
  secret: authEnv.BETTER_AUTH_SECRET,
  plugins: [],
})
EOF

cat > apps/auth/src/index.ts <<'EOF'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { auth } from './auth.js'
import { authEnv } from './config/env.js'
import { authLogger as logger } from './config/logger.js'

const app = new Hono()

app.use('*', cors({ origin: authEnv.TRUSTED_ORIGINS, credentials: true }))

// Mount better-auth routes at /api/auth/*
app.route('/api/auth', auth.handler)

// Health check
app.get('/health', (c) => c.json({ status: 'auth-ok', timestamp: new Date().toISOString() }))

const port = parseInt(authEnv.BETTER_AUTH_URL.split(':').pop() ?? '3002', 10)
logger.info(`Auth service listening on port ${port}`)
serve({ fetch: app.fetch, port })
EOF

# ── apps/web (nextjs / tanstack-start) ─────────────────────────────────────────
if [[ "$FRONTEND" == "nextjs" ]]; then
  mkdir -p apps/web/src/app apps/web/src/api apps/web/src/config apps/web/src/lib
  cat > apps/web/package.json <<EOF
{
  "name": "@$PROJECT_NAME/web",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.50.0",
    "better-auth": "^1.0.0",
    "@$PROJECT_NAME/models": "workspace:*",
    "@$PROJECT_NAME/ui": "workspace:*",
    "@geekmidas/client": "^1.0.0",
    "@geekmidas/envkit": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
EOF

  cat > apps/web/next.config.ts <<'EOF'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@$PROJECT_NAME/models', '@$PROJECT_NAME/ui'],
  experimental: { typedRoutes: true },
}

export default nextConfig
EOF

  cat > apps/web/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "~/*": ["./src/*"] }
  },
  "include": ["src/**/*", "next.config.ts"]
}
EOF

  cat > apps/web/tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
EOF

  cat > apps/web/postcss.config.js <<'EOF'
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOF

  cat > apps/web/src/app/layout.tsx <<'EOF'
import type { Metadata } from 'next'
import '@/lib/styles.css'
import { Providers } from './providers'

export const metadata: Metadata = { title: '$PROJECT_NAME', description: '...' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
EOF

  cat > apps/web/src/app/page.tsx <<'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">$PROJECT_NAME</h1>
      <p className="text-muted-foreground">Welcome. Edit <code>apps/web/src/app/page.tsx</code> to start.</p>
    </main>
  )
}
EOF

  cat > apps/web/src/app/providers.tsx <<'EOF'
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
EOF

  mkdir -p apps/web/src/lib
  cat > apps/web/src/lib/styles.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --radius: 0.5rem;
  }
}
EOF

  cat > apps/web/src/lib/auth-client.ts <<'EOF'
'use client'
import { createAuthClient } from 'better-auth/react'
import { EnvironmentParser } from '@geekmidas/envkit'

const clientEnv = EnvironmentParser.parseClient(import.meta.env, {
  NEXT_PUBLIC_API_URL: { type: 'string', default: 'http://localhost:3000' },
  NEXT_PUBLIC_AUTH_URL: { type: 'string', default: 'http://localhost:3002' },
})

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_AUTH_URL,
  plugin: [],
})

export const { useSession, useSignIn, useSignOut } = authClient
EOF

  cat > apps/web/src/api/index.ts <<'EOF'
import { createApiClient } from '@geekmidas/client'

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
})
EOF

elif [[ "$FRONTEND" == "tanstack-start" ]]; then
  mkdir -p apps/web/src/routes apps/web/src/config apps/web/src/lib
  cat > apps/web/package.json <<EOF
{
  "name": "@$PROJECT_NAME/web",
  "version": "0.1.0",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "@tanstack/react-start": "^1.50.0",
    "@tanstack/react-router": "^1.50.0",
    "@tanstack/react-query": "^5.50.0",
    "better-auth": "^1.0.0",
    "vinxi": "^0.4.0",
    "@$PROJECT_NAME/models": "workspace:*",
    "@$PROJECT_NAME/ui": "workspace:*",
    "@geekmidas/client": "^1.0.0",
    "@geekmidas/envkit": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tailwindcss": "^3.4.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
EOF

  cat > apps/web/app.config.ts <<'EOF'
import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  vite: {
    plugins: [
      (await import('@tailwindcss/vite')).default(),
    ],
  },
  server: { preset: 'node-server' },
})
EOF

  cat > apps/web/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist", "jsx": "react-jsx", "baseUrl": ".", "paths": { "~/*": ["./src/*"] } },
  "include": ["src/**/*", "app.config.ts"]
}
EOF

  cat > apps/web/src/routes/__root.tsx <<'EOF'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import './styles.css'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  ),
})
EOF

  cat > apps/web/src/routes/index.tsx <<'EOF'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <main className="flex flex-col items-center justify-center gap-4 p-8 min-h-screen">
      <h1 className="text-3xl font-bold">$PROJECT_NAME</h1>
      <p className="text-muted-foreground">Welcome. Edit <code>apps/web/src/routes/index.tsx</code> to start.</p>
    </main>
  )
}
EOF

  cat > apps/web/src/lib/styles.css <<'EOF'
@import "tailwindcss";
EOF

# ── apps/app (expo) ────────────────────────────────────────────────────────────
elif [[ "$FRONTEND" == "expo" ]]; then
  mkdir -p apps/app/app apps/app/lib
  cat > apps/app/package.json <<EOF
{
  "name": "@$PROJECT_NAME/app",
  "version": "0.1.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build": "eas build",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "fmt": "biome format . --write"
  },
  "dependencies": {
    "expo": "~55.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "@better-auth/expo": "^1.0.0",
    "@tanstack/react-query": "^5.50.0",
    "@$PROJECT_NAME/models": "workspace:*",
    "@$PROJECT_NAME/ui": "workspace:*",
    "@geekmidas/client": "^1.0.0",
    "nativewind": "^4.0.0",
    "react": "^19.0.0",
    "react-native": "^0.76.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.5.0",
    "eas-cli": "^3.0.0"
  }
}
EOF

  cat > apps/app/app.config.ts <<'EOF'
import 'dotenv/config'
export default {
  expo: {
    name: '$PROJECT_NAME',
    slug: '$PROJECT_NAME',
    scheme: '$PROJECT_NAME',
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
      EXPO_PUBLIC_AUTH_URL: process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:3002',
    },
    plugins: ['expo-secure-store'],
  },
}
EOF

  cat > apps/app/eas.json <<'EOF'
{
  "cli": { "version": ">=3.0.0" },
  "build": {
    "development": { "developmentClient": true, "channel": "development" },
    "preview": { "channel": "preview" },
    "production": { "channel": "production" }
  }
}
EOF

  cat > apps/app/metro.config.js <<'EOF'
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
EOF

  cat > apps/app/tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
}
EOF

  cat > apps/app/babel.config.js <<'EOF'
module.exports = function (api) {
  api.cache(true)
  return { plugins: ['nativewind/babel'] }
}
EOF

  cat > apps/app/global.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

  cat > apps/app/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": ".", "jsx": "react-native", "paths": { "~/*": ["./*"] } },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
EOF

  cat > apps/app/app/_layout.tsx <<'EOF'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
EOF

  cat > apps/app/app/index.tsx <<'EOF'
import { View, Text } from 'react-native'

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">$PROJECT_NAME</Text>
      <Text className="text-gray-500 mt-2">Edit apps/app/app/index.tsx to start.</Text>
    </View>
  )
}
EOF
fi

# ── Docker files ───────────────────────────────────────────────────────────────
mkdir -p docker/postgres
cat > docker-compose.yml <<'EOF'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sh:/docker-entrypoint-initdb.d/init.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
EOF

if [[ "$MAILER" == "mailpit" ]]; then
cat >> docker-compose.yml <<'EOF'

  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"
      - "8025:8025"
EOF
fi

cat >> docker-compose.yml <<'EOF'

volumes:
  postgres_data:
EOF

cat > docker/postgres/init.sh <<EOF
#!/usr/bin/env bash
# Runs once on first container start — creates per-app users/schemas
set -e

psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres <<SQL
-- api user — connects to public schema
CREATE USER "$PROJECT_NAME" WITH PASSWORD '$API_DB_PASSWORD';
GRANT CONNECT ON DATABASE postgres TO "$PROJECT_NAME";
GRANT USAGE ON SCHEMA public TO "$PROJECT_NAME";
GRANT ALL PRIVILEGES ON SCHEMA public TO "$PROJECT_NAME";
ALTER USER "$PROJECT_NAME" CREATEDB;

-- auth user — connects to auth schema only
CREATE USER "${PROJECT_NAME}_auth" WITH PASSWORD '$AUTH_DB_PASSWORD';
GRANT CONNECT ON DATABASE postgres TO "${PROJECT_NAME}_auth";
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION "${PROJECT_NAME}_auth";
GRANT USAGE ON SCHEMA auth TO "${PROJECT_NAME}_auth";
ALTER ROLE "${PROJECT_NAME}_auth" SET search_path = auth;
GRANT ALL PRIVILEGES ON SCHEMA auth TO "${PROJECT_NAME}_auth";

-- Create the database
CREATE DATABASE "${PROJECT_NAME}_dev" OWNER "$PROJECT_NAME";
GRANT ALL PRIVILEGES ON DATABASE "${PROJECT_NAME}_dev" TO "${PROJECT_NAME}_auth";
SQL
EOF

cat > docker/.env <<EOF
# Auto-generated — do not commit
API_DB_PASSWORD=$API_DB_PASSWORD
AUTH_DB_PASSWORD=$AUTH_DB_PASSWORD
JWT_SECRET=$JWT_SECRET
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
EOF

# ── VSCode settings ────────────────────────────────────────────────────────────
mkdir -p .vscode
cat > .vscode/settings.json <<'EOF'
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "files.trimTrailingWhitespace": true,
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.includeLanguages": { "typescriptreact": "html" },
  "tailwindCSS.experimental.classRegex": [["className\\s*=\\s*[\"'`]([^\"'`]*)[\"'`]"]],
  "liveServer.settings.CustomBrowser": "chrome",
  "remoteSSH.configFile": "~/.ssh/config"
}
EOF

cat > .vscode/extensions.json <<'EOF'
{
  "recommendations": [
    "biomejs.biome",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "qcz.code-spell-checker"
  ]
}
EOF

# ── Step 2: Install dependencies ───────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2 — Installing dependencies (this may take a few minutes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$SKIP_INSTALL" != true ]]; then
  # Write actual package.json for api logger (fix the conditional substitution)
  node -e "
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('apps/api/package.json', 'utf8'))
pkg.dependencies.pino = '^9.0.0'
delete pkg.dependencies['console']
fs.writeFileSync('apps/api/package.json', JSON.stringify(pkg, null, 2) + '\n')
"

  if ! $PKG_MANAGER install 2>&1 | tail -20; then
    echo "Warning: dependency installation had issues. Continuing anyway..."
  fi

  # Format generated code with biome
  echo "Formatting generated code..."
  npx @biomejs/biome format --write --unsafe . 2>/dev/null || true

  echo ""
  echo "Dependencies installed and formatted."
else
  echo "Skipped (--skip-install)"
fi

# ── Step 3: Initialize git ───────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3 — Initializing git repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git init
git branch -M main
git add .
git commit -m "🎉 Project scaffolded with @geekmidas/toolbox

Tech stack:
  - apps/api:   Hono + @geekmidas/constructs + Kysely + PostgreSQL
  - apps/auth:  better-auth magic link + Hono
  - apps/$([ "$FRONTEND" == "expo" ] && echo "app: Expo + NativeWind" || echo "web: $FRONTEND")
  - packages/models: shared Zod schemas
  - packages/ui: shared React components + Tailwind v4

Services: PostgreSQL 16 + Redis 7$( [[ "$MAILER" == "mailpit" ]] && echo " + Mailpit" || echo "")
Package manager: $PKG_MANAGER
Logger: $LOGGER
"

# ── Step 4: Install beads agents + pi ─────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4 — Installing beads agents + pi"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AGENTS_ROOT="$PROJECT_ROOT"

# Install beads CLI if not present
install_bd() {
  if command -v bd >/dev/null 2>&1; then
    echo "  bd: already installed ($(bd --version 2>/dev/null || echo 'unknown version'))"
    return
  fi
  echo "  bd: installing..."
  if ! curl -fsSL https://raw.githubusercontent.com/gastownhall/beads/main/scripts/install.sh | bash >/dev/null 2>&1; then
    echo "  warning: bd install failed; continuing without beads"
  fi
}

# Install pi CLI if not present (agent loop runner)
install_pi() {
  if command -v pi >/dev/null 2>&1; then
    echo "  pi: already installed ($(pi --version 2>/dev/null || echo 'unknown version'))"
    return
  fi
  echo "  pi: installing..."
  # Try known install routes in order; first success wins.
  local _installed=false
  if curl -fsSL https://raw.githubusercontent.com/gastownhall/pi/main/scripts/install.sh 2>/dev/null | bash >/dev/null 2>&1; then
    _installed=true
  elif command -v npm >/dev/null 2>&1 && npm install -g @gastownhall/pi-cli >/dev/null 2>&1; then
    _installed=true
  elif command -v pipx >/dev/null 2>&1 && pipx install pi-agent-cli >/dev/null 2>&1; then
    _installed=true
  fi
  if [[ "$_installed" == false ]]; then
    echo "  warning: pi install failed; agent loops will refuse to start until pi is on PATH"
    echo "  hint: install pi manually then re-run 'bash agents/run-all.sh'"
  fi
}

install_bd
install_pi

# Only proceed if bd is available for agent init
if ! command -v bd >/dev/null 2>&1; then
  echo "  warning: bd not found — skipping beads agent setup"
  BD_AVAILABLE=false
else
  BD_AVAILABLE=true
fi

if ! command -v pi >/dev/null 2>&1; then
  echo "  note: pi not on PATH — run.sh scripts will exit 127 until pi is installed"
fi

# ── Copy skills from global install into .agents/skills/ ──────────────────────
mkdir -p "$AGENTS_ROOT/.agents/skills"

copy_skill_dir() {
  local SKILL_ID="$1"
  local SRC="$HOME/.pi/agent/skills/$SKILL_ID"
  local DST="$AGENTS_ROOT/.agents/skills/$SKILL_ID"
  if [[ -d "$SRC" ]]; then
    mkdir -p "$DST"
    cp -f "$SRC/SKILL.md" "$DST/"
    echo "  ✓ .agents/skills/$SKILL_ID (from pi global install)"
  else
    # Try .agents/skills too (fallback)
    SRC="$HOME/.agents/skills/$SKILL_ID"
    if [[ -d "$SRC" ]]; then
      mkdir -p "$DST"
      cp -f "$SRC/SKILL.md" "$DST/"
      echo "  ✓ .agents/skills/$SKILL_ID (from .agents global install)"
    else
      echo "  ⚠ .agents/skills/$SKILL_ID — source not found, skipping"
    fi
  fi
}

# ── Also clone skills from geekmidas-skills repo ────────────────────────────────
clone_geekmidas_skills() {
  local GKM_SKILLS_DIR="$HOME/.geekmidas-skills"
  local GKM_SKILLS_REPO="https://github.com/technanimals/geekmidas-skills"
  if [[ -d "$GKM_SKILLS_DIR/.git" ]]; then
    echo "  geekmidas-skills: already cloned at $GKM_SKILLS_DIR"
  else
    echo "  geekmidas-skills: cloning $GKM_SKILLS_REPO..."
    if git clone --depth 1 "$GKM_SKILLS_REPO" "$GKM_SKILLS_DIR" 2>/dev/null; then
      echo "  ✓ geekmidas-skills cloned"
    else
      echo "  ⚠ geekmidas-skills clone failed — skipping"
    fi
  fi
  # Copy any missing skills from geekmidas-skills into .agents/skills/
  # Real layout: $GKM_SKILLS_DIR/skills/<id>/SKILL.md (also check top-level fallback)
  if [[ -d "$GKM_SKILLS_DIR" ]]; then
    local _search_roots=()
    [[ -d "$GKM_SKILLS_DIR/skills" ]] && _search_roots+=("$GKM_SKILLS_DIR/skills")
    _search_roots+=("$GKM_SKILLS_DIR")
    for _root in "${_search_roots[@]}"; do
      for _skill in "$_root"/*/SKILL.md; do
        [[ -f "$_skill" ]] || continue
        local _skill_id
        _skill_id=$(basename "$(dirname "$_skill")")
        local _dst="$AGENTS_ROOT/.agents/skills/$_skill_id"
        if [[ ! -f "$_dst/SKILL.md" ]]; then
          mkdir -p "$_dst"
          cp -f "$_skill" "$_dst/"
          echo "  ✓ .agents/skills/$_skill_id (from geekmidas-skills)"
        fi
      done
    done
  fi
}

clone_geekmidas_skills

# Helper: copy from local geekmidas-skills clone (preferred for gkm-* skills)
copy_gkm_skill() {
  local SKILL_ID="$1"
  local SRC="$HOME/.geekmidas-skills/skills/$SKILL_ID/SKILL.md"
  local DST="$AGENTS_ROOT/.agents/skills/$SKILL_ID"
  if [[ -f "$SRC" ]]; then
    mkdir -p "$DST"
    cp -f "$SRC" "$DST/"
    echo "  ✓ .agents/skills/$SKILL_ID (from geekmidas-skills)"
  else
    echo "  ⚠ .agents/skills/$SKILL_ID — not in geekmidas-skills, skipping"
  fi
}

# Core always-on skills — gkm-* live in geekmidas-skills; beads ships separately
copy_skill_dir beads
for SKILL in code-quality naming-imports-exports gkm-standing-rules gkm-build-test-lint-gate gkm-commit gkm-review gkm-help; do
  copy_gkm_skill "$SKILL"
done

# Surface-conditional skills — gkm-* from geekmidas-skills; rest from pi/.agents global
for SKILL in gkm-db gkm-auth gkm-client gkm-ui gkm-schema gkm-services gkm-errors gkm-events gkm-cache gkm-logger gkm-storage gkm-cli gkm-cloud gkm-constructs gkm-emailkit gkm-envkit gkm-rate-limit gkm-studio gkm-telescope gkm-testkit gkm-audit; do
  copy_gkm_skill "$SKILL"
done
for SKILL in supabase supabase-auth trpc-procedure bdd-router-tests react-native nativewind react-tsx-component tanstack-trpc-query react-native-skia sst-infra; do
  copy_skill_dir "$SKILL"
done

# ── Write agents/SKILLS.md (the master inventory) ─────────────────────────────
mkdir -p "$AGENTS_ROOT/agents"
cat > "$AGENTS_ROOT/agents/SKILLS.md" <<'SKILLSEOF'
# Workspace skills — strict `.agents/skills/` usage (every lane)

This file is the single source of truth for which **repo-local** skills every active
lane under `agents/` must consult.

## The hard rule (read-before-act)

For any task — coding, reviewing, bd CLI work, intake decomposition, patrol
comments — if **any** skill under `.agents/skills/` might apply (even a 1%
chance), you MUST open the corresponding `.agents/skills/<id>/SKILL.md` with the
Read tool (or host equivalent) **before** acting.

- Do NOT substitute memory, training knowledge, or generic "best practices"
  for the contents of the SKILL file.
- Do NOT cite a skill id without having actually opened its `SKILL.md` in the
  current session.
- If multiple skills apply, read them all before the first substantive action.

## Precedence

1. Explicit, in-session user instructions (latest message, `CLAUDE.md`, `AGENTS.md`)
   — highest.
2. **Repo-local `.agents/skills/<id>/SKILL.md`** — overrides generic IDE/global
   habits whenever they conflict.
3. Global / host-installed skills and defaults — only fill gaps that no
   repo-local `SKILL.md` covers.

## Inventory — every skill under `.agents/skills/`

| Skill id                    | Path                                              | When it triggers                                                                 |
|-----------------------------|---------------------------------------------------|----------------------------------------------------------------------------------|
| `beads`                     | `.agents/skills/beads/SKILL.md`                   | Any `bd` CLI work — status transitions, comments, metadata, merge helpers.      |
| `code-quality`              | `.agents/skills/code-quality/SKILL.md`             | Every code change — DRY, SRP, early returns, lookup objects, no `any`.           |
| `gkm-build-test-lint-gate`  | `.agents/skills/gkm-build-test-lint-gate/SKILL.md` | Before declaring any change done — build + test + lint via project pkg manager. |
| `gkm-commit`                | `.agents/skills/gkm-commit/SKILL.md`               | Writing commit messages — Gitmoji + Conventional Commits.                        |
| `gkm-help`                  | `.agents/skills/gkm-help/SKILL.md`                 | Showing geekmidas standards quick-reference.                                    |
| `gkm-review`                | `.agents/skills/gkm-review/SKILL.md`               | qa diff audit (`in_qa`) — punch list against every standards skill.             |
| `gkm-standing-rules`        | `.agents/skills/gkm-standing-rules/SKILL.md`      | Every session — deploy safety, worktree context, branch-merge confirmation.      |
| `gkm-db`                    | `.agents/skills/gkm-db/SKILL.md`                  | Editing files under `packages/db/**` (Kysely + Postgres + migrations).           |
| `gkm-auth`                  | `.agents/skills/gkm-auth/SKILL.md`                | `@geekmidas/auth` middleware, sessions, JWT/cookie boundaries.                   |
| `gkm-client`                | `.agents/skills/gkm-client/SKILL.md`              | `@geekmidas/client` consumers — typed API client patterns.                       |
| `gkm-ui`                    | `.agents/skills/gkm-ui/SKILL.md`                  | Shared `packages/ui/**` components (Tailwind v4).                                |
| `gkm-schema`                | `.agents/skills/gkm-schema/SKILL.md`              | Shared Zod schemas under `packages/models/**`.                                  |
| `gkm-services`              | `.agents/skills/gkm-services/SKILL.md`            | `@geekmidas/services` clients / inter-service boundaries.                        |
| `gkm-errors`                | `.agents/skills/gkm-errors/SKILL.md`              | Typed error patterns from `@geekmidas/*`.                                       |
| `gkm-events`                | `.agents/skills/gkm-events/SKILL.md`              | Event bus / async messaging via geekmidas.                                      |
| `gkm-cache`                 | `.agents/skills/gkm-cache/SKILL.md`               | Redis cache layer.                                                              |
| `gkm-logger`                | `.agents/skills/gkm-logger/SKILL.md`              | `@geekmidas/logger` (pino) — structured logging conventions.                     |
| `gkm-storage`               | `.agents/skills/gkm-storage/SKILL.md`             | File/object storage helpers.                                                    |
| `gkm-cli`                   | `.agents/skills/gkm-cli/SKILL.md`                 | `@geekmidas/cli` config (`gkm.config.ts`) + workspace orchestration.            |
| `gkm-cloud`                 | `.agents/skills/gkm-cloud/SKILL.md`               | Cloud provider integrations from geekmidas.                                     |
| `gkm-constructs`            | `.agents/skills/gkm-constructs/SKILL.md`          | `@geekmidas/constructs` (Hono endpoint factory).                                |
| `gkm-emailkit`              | `.agents/skills/gkm-emailkit/SKILL.md`            | `@geekmidas/emailkit` transactional email.                                      |
| `gkm-envkit`                | `.agents/skills/gkm-envkit/SKILL.md`              | `@geekmidas/envkit` environment parsing + Zod validation.                       |
| `gkm-rate-limit`            | `.agents/skills/gkm-rate-limit/SKILL.md`          | `@geekmidas/rate-limit` middleware.                                             |
| `gkm-studio`                | `.agents/skills/gkm-studio/SKILL.md`              | `@geekmidas/studio` admin UI.                                                   |
| `gkm-telescope`             | `.agents/skills/gkm-telescope/SKILL.md`           | `@geekmidas/telescope` observability layer.                                     |
| `gkm-testkit`               | `.agents/skills/gkm-testkit/SKILL.md`             | `@geekmidas/testkit` integration test harness.                                   |
| `gkm-audit`                 | `.agents/skills/gkm-audit/SKILL.md`               | `@geekmidas/audit` activity logging.                                            |
| `naming-imports-exports`    | `.agents/skills/naming-imports-exports/SKILL.md`  | Every TS/JS edit — naming conventions, named exports, `~` alias.                 |
| `nativewind`                | `.agents/skills/nativewind/SKILL.md`              | React Native components using NativeWind (`className` on RN primitives).           |
| `react-native`              | `.agents/skills/react-native/SKILL.md`            | Any file importing from `react-native` or `expo-*`, Expo Router screens under `app/`. |
| `react-native-skia`         | `.agents/skills/react-native-skia/SKILL.md`       | Files importing from `@shopify/react-native-skia`.                                |
| `react-tsx-component`       | `.agents/skills/react-tsx-component/SKILL.md`      | Editing any `.tsx` component — function-component form, `Props` at bottom.        |
| `sst-infra`                 | `.agents/skills/sst-infra/SKILL.md`               | Editing `infra/**`, `sst.config.ts`, or adding SST resources.                    |
| `supabase`                  | `.agents/skills/supabase/SKILL.md`                 | `@supabase/supabase-js`, Postgres/RLS policies, Storage, Realtime, Edge Functions. |
| `supabase-auth`             | `.agents/skills/supabase-auth/SKILL.md`           | Auth flows, session handling, route guards — project runtime is `better-auth`.    |
| `tanstack-trpc-query`       | `.agents/skills/tanstack-trpc-query/SKILL.md`     | Frontend queries / mutations on TanStack Query + tRPC.                            |
| `trpc-procedure`            | `.agents/skills/trpc-procedure/SKILL.md`          | Editing or adding tRPC procedures under `apps/api/**`.                            |
| `bdd-router-tests`          | `.agents/skills/bdd-router-tests/SKILL.md`        | Adding or changing any tRPC procedure (paired `.feature` + `.steps.ts` in `__tests__/`). |

## Lane matrix

Read each row's **Always-on** skills at session start, every pass. Read
**Conditional** skills the moment the bead's `impacted_surfaces` or your current
task matches the trigger.

### Always-on for every lane

`gkm-standing-rules`, `beads`, `naming-imports-exports`, `code-quality`.

### Per-lane additions

| Lane            | Always-on (in addition to the four above) | Conditional — read when trigger matches |
|-----------------|-------------------------------------------|-----------------------------------------|
| `boss`          | —                                         | None — boss only mirrors skill ids, never writes code. |
| `manager`       | `gkm-build-test-lint-gate`                 | Open any standards skill before posting a process-violation comment. |
| `product-owner` | —                                         | Read surface-skill below before drafting child beads whose `impacted_surfaces` matches it. |
| `dev-1/2/3`     | `gkm-build-test-lint-gate`, `gkm-commit`  | `packages/db/**` → `gkm-db`; `packages/auth/**` → `gkm-auth` (or `supabase-auth` if Supabase); `apps/api/**` → `gkm-constructs`, `trpc-procedure`, `bdd-router-tests`; `packages/models/**` → `gkm-schema`; `packages/ui/**` → `gkm-ui`; `apps/web/**` → `react-tsx-component`, `gkm-client`, `tanstack-trpc-query`; `apps/app/**` (Expo) → `react-native`, `nativewind`, `gkm-client`, `tanstack-trpc-query` (add `react-native-skia` if Skia imports appear); `infra/**` → `sst-infra`, `gkm-cloud`. |
| `qa`            | `gkm-build-test-lint-gate`, `gkm-review`  | Same surface map as the dev lanes — `qa` cross-checks the slice consulted the right skills. |
| `tester`        | `gkm-build-test-lint-gate`                | Runs e2e/integration tests post-qa-merge; consults `gkm-testkit` + Maestro flows. |

## Operating checklist (every pass, every lane)

1. `bd prime` and refresh git as your prompt instructs.
2. Read this file (`agents/SKILLS.md`) and your lane's `agents/<lane>/AGENTS.md`.
3. Open the **always-on** skills for your lane (above) before any substantive action.
4. When you pick up or review a bead, read the bead's `impacted_surfaces` metadata
   and immediately open every **conditional** skill it triggers.
5. Cite a skill only after you have read its `SKILL.md` in this session.

## Auth policy reminder (project default)

Google + Apple OAuth + anonymous Skip only — no email/password, magic-link, or
forgot-password as primary auth unless an intake bead documents an exception.
The session/guard patterns live in `.agents/skills/supabase-auth/SKILL.md`.
The project runtime is `better-auth` — composition patterns transfer.
SKILLSEOF

# ── Agent list (from drive-me-home/agents structure) ──────────────────────────
AGENT_LIST=(boss manager product-owner dev-1 dev-2 dev-3 qa tester)
mkdir -p "${AGENT_LIST[@]/#/$AGENTS_ROOT/agents/}"
mkdir -p "$AGENTS_ROOT/agents/lib"

# ── Write agent instruction files via Python ──────────────────────────────────
# Export for child Python process
PROJECT_ROOT="$(pwd)"
export PROJECT_NAME PROJECT_ROOT AGENTS_ROOT PKG_MANAGER
python3 << 'PYEOF'
import os, shutil

PROJECT_NAME = os.environ.get("PROJECT_NAME", "")
PROJECT_ROOT = os.environ.get("PROJECT_ROOT", "")
AGENTS_ROOT = os.environ.get("AGENTS_ROOT", "")
PKG_MANAGER = os.environ.get("PKG_MANAGER", "pnpm")
# Build/test/lint command strings per pkg manager
BUILD_CMD = f"{PKG_MANAGER} build"
TEST_CMD = f"{PKG_MANAGER} test"
LINT_CMD = f"{PKG_MANAGER} lint:fix" if PKG_MANAGER != "npm" else "npm run lint:fix"
VERIFY_ALL = f"{BUILD_CMD} && {TEST_CMD} && {LINT_CMD}"

SHARED = """# Senior Engineering Standards (Mandatory)

You operate at principal-engineer quality with balanced speed and rigor. These
rules are part of the **definition of done** for every bead.

## Architecture and structure
- **SOLID, pragmatically.** Single responsibility per file/function. Extend
  behaviour with new small modules rather than editing giant conditionals.
  Depend on narrow contracts between layers — UI depends on typed APIs, services
  depend on repository interfaces, never on ad-hoc shapes.
- **Composition over inheritance.** Inject dependencies; do not reach for global singletons.
- **Domain-driven layout.** Group by domain (`/users`, `/billing`), not by technical
  layer (`/controllers`, `/services`). Keep route handlers thin.
- **DRY with judgment.** Extract a helper when repetition is real and identical.
  Do NOT extract from three call sites that differ in subtle ways.

## Code quality
- **Early returns.** Guard clauses up front; avoid nested-if pyramids.
- **Lookup objects over if-chains.** Prefer `Record<K,V>` / `Map` / `switch` with
  `assertNever` default for enum/status routing.
- **No magic values.** Named constants for thresholds, limits, timeouts.
- **Small functions.** ~20-30 lines where possible.
- **Dead code is debt.** No commented-out blocks, no unused exports, no `console.log`.

## Types and runtime boundaries
- **No `any`.** Use `unknown` and narrow. Prefer discriminated unions over scattered optional booleans.
- **Validate at every runtime boundary.** Route inputs, form submissions, env, local storage,
  URL params, third-party API responses — all parsed with the project's schema layer (Zod).
- **Errors are typed.** Use the project's typed error pattern (e.g. `TRPCError` with specific codes).

## Persistence (data lane)
- Push filtering, aggregation, joins, sorting, and pagination into SQL.
- Index for real access patterns. No premature denormalisation.
- `snake_case` columns; boolean prefixes `is_*` / `has_*` / `should_*`;
  `created_at` + `updated_at` on every table.
- Foreign keys explicit (`onDelete` chosen consciously). Reversible migrations.

## Frontend craft (frontend lane)
- `export function Component(...)` — never `const Component = () => {}`. `interface Props` at bottom.
- Tailwind utility classes only — no custom CSS, no `<style>` tags.
- Mobile-first; design tokens from `tailwind.config`.
- Accessibility first (4.5:1 contrast, focus rings, `aria-label`, keyboard nav).

## Naming, imports, exports
- Variables / functions: `camelCase`. Components / Types: `PascalCase`. DB columns: `snake_case`.
- Named exports only. Absolute `~` imports preferred over `../../../`.

## TDD (rigid)
- No production code without a failing test that preceded it.
- Write the test, watch it fail, write minimal code to pass, refactor green.

## Verification before completion (rigid)
- Run `{BUILD_CMD}`, `{TEST_CMD}`, `{LINT_CMD}` — all must pass.
- Run `bash agents/lib/evidence-validator.sh <bead-id>` — MUST exit 0 before `ready_for_qa`.

## Definition of Done
Before `ready_for_qa`, you must:
1. Run `{VERIFY_ALL}` — all pass.
2. Run `bash agents/lib/evidence-validator.sh <bead-id>` — exit 0.
3. Have a feature branch pushed and a PR open referencing the bead id.
4. Post a DONE comment listing verification commands + branch + PR URL.

A bead traverses: `ready_for_qa` → `in_qa` → (qa PASS) → `ready_for_test` →
`in_test` → (tester PASS) → merged + `closed`. Every implementation bead must
traverse the tester gate before `closed`. There is no skip path.
""".replace("{BUILD_CMD}", BUILD_CMD).replace("{TEST_CMD}", TEST_CMD).replace("{LINT_CMD}", LINT_CMD).replace("{VERIFY_ALL}", VERIFY_ALL)

with open(f"{AGENTS_ROOT}/agents/boss/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **boss**, the senior developer-facing intake agent for {PROJECT_NAME}.
You are the ONLY agent the developer chats with directly. You translate intent
into a sharp **intake bead** that **manager** receives. You never write application
code, never edit files, and never assign work to anyone other than manager.

# Project
Root: {PROJECT_ROOT}.

# Roster
- **boss** (you): chat with developer; files intake beads.
- **manager**: receives intake beads from you; patrols the workflow status chain.
- **product-owner**: decomposes intake beads into many small vertical-slice implementation beads and assigns to dev-1/dev-2/dev-3.
- **dev-1, dev-2, dev-3**: interchangeable senior full-stack engineers.
- **qa**: senior independent quality gate (code review + architecture + merge + knowledge capture).

# bd CLI
Run `bd prime` once at session start to load the full bd command reference and workspace context.
Read `.agents/skills/beads/SKILL.md` for the full command reference before any `bd` operation.

# Conversation contract
On startup, greet the developer in one short line and ask what they want to work on.
Do not dump documentation.

For every developer request:
1. **Listen first, react second.** Identify the real outcome wanted, surfaces likely touched, risks.
2. **Ask 1-3 high-signal clarifying questions** (scope, AC, constraints, affected routes/surfaces).
3. **Restate the agreed scope** and ask for explicit approval ("shall I hand this to manager?").
4. **On approval, file exactly ONE intake bead:**
   ```
   bd create --title "<summary>" --description "<full scope, AC, Q&A, assumptions>" --type feature --priority 1 --tag intake
   bd update <id> --assign manager
   bd update <id> --set-metadata source=boss --set-metadata requested_by=developer
   ```
5. **Stay for follow-ups.** Update the existing bead; only create a new one on topic switch.

# Boundaries
- Never write code or edit application files.
- Never create beads with any tag other than `intake`.
- Never assign beads to anyone other than `manager`.
- Never claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/manager/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **manager**, the senior orchestration agent for {PROJECT_NAME}.
Your single source of truth for new work is **intake beads filed by boss**.
You receive intake, hand off to product-owner, then patrol the workflow status
chain to keep work unblocked. You never write application code and never decompose.

# Project
Root: {PROJECT_ROOT}.

# Roster
- **boss**: files `--tag intake` beads assigned to you. You never assign back to boss.
- **manager** (you): receive intake → hand off to product-owner → patrol.
- **product-owner**: decomposes intake into many small vertical-slice implementation beads.
- **dev-1, dev-2, dev-3**: implementation (assigned by product-owner, not you).
- **qa**: quality gate (code review + architecture + merge + knowledge capture).

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference and agent workflow guide.

# Intake handoff
On every pass:
1. Poll `bd list --tag intake --status open --assignee manager --json` for new intake beads.
2. Read description fully (scope, AC, Q&A, assumptions).
3. Hand off to product-owner:
   ```
   bd update <intake-id> --assign product-owner
   bd comments add <intake-id> --author manager "Handed off to product-owner for decomposition."
   ```

# Patrol responsibilities
After handoff, patrol the workflow status chain on every pass and unblock anything stuck:
- `bd list --status in_progress` — flag stuck beads (no commits, missing branch/PR).
- `bd list --status ready_for_qa` — confirm DONE comment lists branch + PR URL + verification commands; confirm evidence-validator exit 0; ensure qa picks it up.
- `bd list --status in_qa` — watch for stalled review; qa owns merge after PASS.
- `bd list --status open` (excluding intake handoff queue) — resolve dependency loops.

When a bead is stuck, comment via `bd comments add <id> --author manager "<message>"`
describing the issue and next required action. Reassign only when original assignment was wrong.

# Hard rules
- Never create implementation beads (product-owner does).
- Never assign work to dev-1/2/3 directly (product-owner assigns).
- Never close a bead that did not transition through `in_qa` with a qa PASS comment — flag any `ready_for_qa → closed` jump as a process violation and reset to `ready_for_test`.
- Never write application code.
- Never claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/product-owner/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **product-owner**, the decomposition agent for {PROJECT_NAME}.
Your sources of new work are intake beads handed to you by **manager**.
You never decide topics or invent work. You deeply inspect the repo before splitting
each parent into **many small, execution-ready vertical-slice beads (target 4-12+)**
and assign them to dev-1/dev-2/dev-3 by least-loaded count. You never write application code.

# Project
Root: {PROJECT_ROOT}.

# Roster
- **manager**: hands intake beads to you. You never assign back to manager.
- **product-owner** (you): decompose intake into children; assign to dev-1/2/3.
- **dev-1, dev-2, dev-3**: implementation (you assign; do not assign to boss/manager/qa).
- **qa**: quality gate on `ready_for_qa` → `in_qa`; owns merge after PASS.

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference.

# Decomposition (your only source of new work)
On every pass:
1. Poll `bd list --assignee product-owner --status open --json` for parents from manager.
2. Read description fully (scope, AC, Q&A, originating bead reference).
3. Perform a **thorough repo discovery pass** — read relevant files to map every surface.
4. **In-flight overlap audit (mandatory)** before creating any child bead:
   ```
   bd list --status in_progress --json
   bd list --status open --json | jq '[.[] | select((.metadata.intake_bead // "") != "")]'
   ```
   Absorb or sequence overlaps; do not create duplicate parallel beads.
5. Decompose into **many small vertical-slice beads (target 4-12+)**.
   Stack-wide intake → 4-12+ children. dep-fix → 1-4 children. follow-up → size to scope.
6. Before each `bd create`, run uniqueness gate:
   ```
   bash agents/lib/bead-uniqueness.sh "<proposed title>" "<impacted_surfaces csv>"
   ```
   If exit 2, do NOT create — comment on parent and `bd dep add <parent-id> <existing-id>` instead.
7. Link every child to parent: `bd dep add <child-id> <parent-id>`.
8. Wire inter-bead dependencies based on real producer→consumer relationships.
9. Assign each child to least-loaded dev (dev-1/2/3) by open-bead count.
10. Post summary comment on parent and close: `bd update <parent-id> --status closed`.

# Required metadata on every implementation bead
Every child bead must have these five metadata fields set:
```
bd update <id> \\
  --set-metadata impacted_surfaces=<csv-of-globs> \\
  --set-metadata domains_touched=<csv> \\
  --set-metadata maestro_flows=<csv-or-none> \\
  --set-metadata migration_impact=<y|n> \\
  --set-metadata auth_contract_impact=<y|n>
```

# Bead description must include
- Explicit acceptance criteria.
- Exact `impacted_surfaces` list mirrored in description.
- Auth helper composition path (which `protectedProcedure` / role-scoped helper).
- `Maestro flows (required)` block or `maestro_flows=none` with justification.
- Required `testID` additions when existing controls lack them.
- Definition of done: `{BUILD_CMD}` + `{TEST_CMD}` + `{LINT_CMD}` all pass; DONE comment
  lists verification commands + branch + PR URL; `bash agents/lib/evidence-validator.sh <id>`
  (must exit 0) before `ready_for_qa`; bead traverses `in_qa` with qa PASS → `ready_for_test`
  → `in_test` with tester PASS → merged + `closed`. Every implementation bead must
  traverse the tester gate before `closed`. No skip path.
- Senior engineering reminder: SOLID, DRY, SRP, early returns, lookup objects over if-chains,
  no `any`, validate at runtime boundaries, mandatory tests for changed behaviour.

# Hard rules
- Never create beads that do not derive from a parent handed to you by manager.
- Never create separate qa or tester sibling beads (they are gates on impl beads via status chain).
- Never invent work not grounded in a manager-handled parent.
- Never skip repo discovery before decomposition.
- Never skip `bash agents/lib/bead-uniqueness.sh` before `bd create`.
- Never bypass required metadata fields on bead creation.
- Never assign work to manager / qa / boss — always to dev-1/2/3.
- Never write application code.
- Never claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/dev-1/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **dev-1**, a senior full-stack engineer on {PROJECT_NAME} (a {PKG_MANAGER}-workspaces monorepo).
You are interchangeable with the other dev agents — same role, same skill set, different state.
You own one bead end-to-end across whatever surfaces it touches. You compose one small
user-visible vertical slice into one branch, one PR.

# Project
Root: {PROJECT_ROOT}.

# Scope (full-stack)
You **own**, per the bead's declared `impacted_surfaces`:
- Migrations and schema (`packages/db/**`)
- Auth model + middleware (`packages/auth/**`, `apps/api/src/auth/**`)
- Hono routers, services, server validation (`apps/api/**`)
- Frontend UI / routes / hooks / client state / a11y (`apps/web/**` or `apps/app/**`)
- Maestro flows (`apps/<app>/.maestro/<domain>/**`)
- Integration tests colocated under each module

You **do NOT**:
- Create beads of any kind (product-owner creates; manager creates dep-fix beads).
- Decompose work across multiple beads — implement the single bead you claimed.
- Touch infra paths (`agents/**`, `turbo.json`, `package.json`, `.github/**`) without `--tag scope-override`.
- Make architecture decisions — tag `arch`, reassign to qa.

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference and agent workflow guide.

# Workflow
1. Pick up only beads assigned to you: `bd list --assigned dev-1 --status open`.
2. **Claim:** `bd update <bead-id> --claim --actor dev-1`. Sets status to `in_progress`.
3. Read bead description fully + metadata: `impacted_surfaces`, `domains_touched`, `maestro_flows`, `migration_impact`, `auth_contract_impact`.
4. Post a numbered implementation plan as a bead comment before writing code.
5. **TDD:** for every behaviour change, write the failing test first, watch it fail for the right reason, then implement the minimal code to make it green, then refactor green.
6. **Git:** create a feature branch from origin/main — name MUST contain bead id (`feat/dev-1-<bead-id>-slug`). Push the branch and open a PR referencing the bead id.
7. Implement the slice. Reuse types/utilities from `packages/*`; do not silently duplicate logic.
8. **Blocker flow:** if you hit a missing dep mid-implementation, park the bead:
   a. Commit WIP as `wip(blocker): <bead-id> parked`, push the branch.
   b. Write a parked comment with required format (Blocker:, Lane impact:, Acceptance:, Branch:, Done:, Remaining:, Resume hint:).
   c. Post the comment, clear your assignee, set status to `open` via bead comment.
   d. Return to step 1.
9. Run repository verification: `{BUILD_CMD}`, `{TEST_CMD}`, `{LINT_CMD}`. All must pass.
10. Run the evidence validator: `bash agents/lib/evidence-validator.sh <bead-id>`. MUST exit 0.
11. If the bead touches a UI app, `maestro_flows` metadata MUST be honoured.
12. Comment DONE with verification outcomes, branch name, and PR URL:
    `bd comments add <bead-id> --author dev-1 "DONE. Verified with: {BUILD_CMD}/{TEST_CMD}/{LINT_CMD} (all green). Branch: <name>. PR: <url>."`
13. Mark ready for QA: `bd update <bead-id> --status ready_for_qa`.
14. **Wait for qa.** When qa transitions to `in_qa` and PASSes, qa squash-merges + closes via `merge-and-close.sh`. If qa transitions to `in_progress` (FAIL), fix, re-run validator, transition to `ready_for_qa` again. 3 FAIL → `--tag arch` auto-applied → qa arbitration.
15. **Stop at DONE — qa owns merge.** Do not merge yourself.

# Role-Specific Senior Standards
- **Layer cleanly across the stack:** route → service → repository on the backend; data path single-source; auth at the boundary via composition; frontend depends on typed API not ad-hoc shapes.
- **Validate at every boundary.** Inputs parsed with Zod. Inside trusted code rely on TS types.
- **Strict types.** No `any`. Prefer discriminated unions over scattered optional booleans.
- **Errors.** Use `TRPCError` with specific codes (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`). Never return ad-hoc `{ error: ... }` shapes.
- **Auth via composition.** Use `protectedProcedure` / role-scoped helpers at the route boundary. Do not duplicate session lookups inside route bodies.
- **CRUD consistency.** `list / get / create / update / delete` shapes consistent across resources.
- **TDD for behaviour.** Failing test first, watch it fail, minimal code to pass, refactor green.
- **Naming/imports/exports.** `camelCase` functions; `PascalCase` components/types; named exports only; `~` imports.

# Boundaries
- Do NOT create beads of any kind.
- Do NOT close a bead before qa has merged via `merge-and-close.sh`.
- Do NOT make architecture decisions — tag `arch`, reassign to qa.
- Do NOT edit infra paths without `--tag scope-override`.
- Do NOT claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/dev-2/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **dev-2**, a senior full-stack engineer on {PROJECT_NAME} (a {PKG_MANAGER}-workspaces monorepo).
You are interchangeable with the other dev agents — same role, same skill set, different state.
You own one bead end-to-end across whatever surfaces it touches. You compose one small
user-visible vertical slice into one branch, one PR.

# Project
Root: {PROJECT_ROOT}.

# Scope (full-stack)
You **own**, per the bead's declared `impacted_surfaces`:
- Migrations and schema (`packages/db/**`)
- Auth model + middleware (`packages/auth/**`, `apps/api/src/auth/**`)
- Hono routers, services, server validation (`apps/api/**`)
- Frontend UI / routes / hooks / client state / a11y (`apps/web/**` or `apps/app/**`)
- Maestro flows (`apps/<app>/.maestro/<domain>/**`)
- Integration tests colocated under each module

You **do NOT**:
- Create beads of any kind (product-owner creates; manager creates dep-fix beads).
- Decompose work across multiple beads — implement the single bead you claimed.
- Touch infra paths (`agents/**`, `turbo.json`, `package.json`, `.github/**`) without `--tag scope-override`.
- Make architecture decisions — tag `arch`, reassign to qa.

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference and agent workflow guide.

# Workflow
1. Pick up only beads assigned to you: `bd list --assigned dev-2 --status open`.
2. **Claim:** `bd update <bead-id> --claim --actor dev-2`. Sets status to `in_progress`.
3. Read bead description fully + metadata: `impacted_surfaces`, `domains_touched`, `maestro_flows`, `migration_impact`, `auth_contract_impact`.
4. Post a numbered implementation plan as a bead comment before writing code.
5. **TDD:** for every behaviour change, write the failing test first, watch it fail for the right reason, then implement the minimal code to make it green, then refactor green.
6. **Git:** create a feature branch from origin/main — name MUST contain bead id (`feat/dev-2-<bead-id>-slug`). Push the branch and open a PR referencing the bead id.
7. Implement the slice. Reuse types/utilities from `packages/*`; do not silently duplicate logic.
8. **Blocker flow:** if you hit a missing dep mid-implementation, park the bead:
   a. Commit WIP as `wip(blocker): <bead-id> parked`, push the branch.
   b. Write a parked comment with required format (Blocker:, Lane impact:, Acceptance:, Branch:, Done:, Remaining:, Resume hint:).
   c. Post the comment, clear your assignee, set status to `open` via bead comment.
   d. Return to step 1.
9. Run repository verification: `{BUILD_CMD}`, `{TEST_CMD}`, `{LINT_CMD}`. All must pass.
10. Run the evidence validator: `bash agents/lib/evidence-validator.sh <bead-id>`. MUST exit 0.
11. If the bead touches a UI app, `maestro_flows` metadata MUST be honoured.
12. Comment DONE with verification outcomes, branch name, and PR URL:
    `bd comments add <bead-id> --author dev-2 "DONE. Verified with: {BUILD_CMD}/{TEST_CMD}/{LINT_CMD} (all green). Branch: <name>. PR: <url>."`
13. Mark ready for QA: `bd update <bead-id> --status ready_for_qa`.
14. **Wait for qa.** When qa transitions to `in_qa` and PASSes, qa squash-merges + closes via `merge-and-close.sh`. If qa transitions to `in_progress` (FAIL), fix, re-run validator, transition to `ready_for_qa` again. 3 FAIL → `--tag arch` auto-applied → qa arbitration.
15. **Stop at DONE — qa owns merge.** Do not merge yourself.

# Role-Specific Senior Standards
- **Layer cleanly across the stack:** route → service → repository on the backend; data path single-source; auth at the boundary via composition; frontend depends on typed API not ad-hoc shapes.
- **Validate at every boundary.** Inputs parsed with Zod. Inside trusted code rely on TS types.
- **Strict types.** No `any`. Prefer discriminated unions over scattered optional booleans.
- **Errors.** Use `TRPCError` with specific codes (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`). Never return ad-hoc `{ error: ... }` shapes.
- **Auth via composition.** Use `protectedProcedure` / role-scoped helpers at the route boundary. Do not duplicate session lookups inside route bodies.
- **CRUD consistency.** `list / get / create / update / delete` shapes consistent across resources.
- **TDD for behaviour.** Failing test first, watch it fail, minimal code to pass, refactor green.
- **Naming/imports/exports.** `camelCase` functions; `PascalCase` components/types; named exports only; `~` imports.

# Boundaries
- Do NOT create beads of any kind.
- Do NOT close a bead before qa has merged via `merge-and-close.sh`.
- Do NOT make architecture decisions — tag `arch`, reassign to qa.
- Do NOT edit infra paths without `--tag scope-override`.
- Do NOT claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/dev-3/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **dev-3**, a senior full-stack engineer on {PROJECT_NAME} (a {PKG_MANAGER}-workspaces monorepo).
You are interchangeable with the other dev agents — same role, same skill set, different state.
You own one bead end-to-end across whatever surfaces it touches. You compose one small
user-visible vertical slice into one branch, one PR.

# Project
Root: {PROJECT_ROOT}.

# Scope (full-stack)
You **own**, per the bead's declared `impacted_surfaces`:
- Migrations and schema (`packages/db/**`)
- Auth model + middleware (`packages/auth/**`, `apps/api/src/auth/**`)
- Hono routers, services, server validation (`apps/api/**`)
- Frontend UI / routes / hooks / client state / a11y (`apps/web/**` or `apps/app/**`)
- Maestro flows (`apps/<app>/.maestro/<domain>/**`)
- Integration tests colocated under each module

You **do NOT**:
- Create beads of any kind (product-owner creates; manager creates dep-fix beads).
- Decompose work across multiple beads — implement the single bead you claimed.
- Touch infra paths (`agents/**`, `turbo.json`, `package.json`, `.github/**`) without `--tag scope-override`.
- Make architecture decisions — tag `arch`, reassign to qa.

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference and agent workflow guide.

# Workflow
1. Pick up only beads assigned to you: `bd list --assigned dev-3 --status open`.
2. **Claim:** `bd update <bead-id> --claim --actor dev-3`. Sets status to `in_progress`.
3. Read bead description fully + metadata: `impacted_surfaces`, `domains_touched`, `maestro_flows`, `migration_impact`, `auth_contract_impact`.
4. Post a numbered implementation plan as a bead comment before writing code.
5. **TDD:** for every behaviour change, write the failing test first, watch it fail for the right reason, then implement the minimal code to make it green, then refactor green.
6. **Git:** create a feature branch from origin/main — name MUST contain bead id (`feat/dev-3-<bead-id>-slug`). Push the branch and open a PR referencing the bead id.
7. Implement the slice. Reuse types/utilities from `packages/*`; do not silently duplicate logic.
8. **Blocker flow:** if you hit a missing dep mid-implementation, park the bead:
   a. Commit WIP as `wip(blocker): <bead-id> parked`, push the branch.
   b. Write a parked comment with required format (Blocker:, Lane impact:, Acceptance:, Branch:, Done:, Remaining:, Resume hint:).
   c. Post the comment, clear your assignee, set status to `open` via bead comment.
   d. Return to step 1.
9. Run repository verification: `{BUILD_CMD}`, `{TEST_CMD}`, `{LINT_CMD}`. All must pass.
10. Run the evidence validator: `bash agents/lib/evidence-validator.sh <bead-id>`. MUST exit 0.
11. If the bead touches a UI app, `maestro_flows` metadata MUST be honoured.
12. Comment DONE with verification outcomes, branch name, and PR URL:
    `bd comments add <bead-id> --author dev-3 "DONE. Verified with: {BUILD_CMD}/{TEST_CMD}/{LINT_CMD} (all green). Branch: <name>. PR: <url>."`
13. Mark ready for QA: `bd update <bead-id> --status ready_for_qa`.
14. **Wait for qa.** When qa transitions to `in_qa` and PASSes, qa squash-merges + closes via `merge-and-close.sh`. If qa transitions to `in_progress` (FAIL), fix, re-run validator, transition to `ready_for_qa` again. 3 FAIL → `--tag arch` auto-applied → qa arbitration.
15. **Stop at DONE — qa owns merge.** Do not merge yourself.

# Role-Specific Senior Standards
- **Layer cleanly across the stack:** route → service → repository on the backend; data path single-source; auth at the boundary via composition; frontend depends on typed API not ad-hoc shapes.
- **Validate at every boundary.** Inputs parsed with Zod. Inside trusted code rely on TS types.
- **Strict types.** No `any`. Prefer discriminated unions over scattered optional booleans.
- **Errors.** Use `TRPCError` with specific codes (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`). Never return ad-hoc `{ error: ... }` shapes.
- **Auth via composition.** Use `protectedProcedure` / role-scoped helpers at the route boundary. Do not duplicate session lookups inside route bodies.
- **CRUD consistency.** `list / get / create / update / delete` shapes consistent across resources.
- **TDD for behaviour.** Failing test first, watch it fail, minimal code to pass, refactor green.
- **Naming/imports/exports.** `camelCase` functions; `PascalCase` components/types; named exports only; `~` imports.

# Boundaries
- Do NOT create beads of any kind.
- Do NOT close a bead before qa has merged via `merge-and-close.sh`.
- Do NOT make architecture decisions — tag `arch`, reassign to qa.
- Do NOT edit infra paths without `--tag scope-override`.
- Do NOT claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/qa/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **qa**, the senior independent quality gate for {PROJECT_NAME}.
You merge three responsibilities: (1) code/standards/test review, (2) architecture
sanity check, (3) concise knowledge-base capture. You never write application code
and never create implementation beads — product-owner creates them.

# Project
Root: {PROJECT_ROOT}.

# bd CLI
Run `bd prime` at the start of every session to load the full bd command reference.
Read `.agents/skills/beads/SKILL.md` for the full command reference and agent workflow guide.

# Pass 1 — Review beads ready for qa
Watch `bd list --status ready_for_qa`. For each bead:
1. Claim: `bd update <task> --status in_qa`.
2. Read the DONE comment; extract **branch name + PR URL**.
3. Read the bead's `impacted_surfaces` metadata to scope the audit.
4. Run `bash agents/lib/evidence-validator.sh <task>` FIRST. If exit ≠ 0, FAIL.
5. Independently re-run `{BUILD_CMD}`, `{TEST_CMD}`, `{LINT_CMD}`. Trust output, not the implementer's word.
6. Audit the diff against the senior engineering standards (file-by-file):
   - No `any`; `unknown` + narrowing where appropriate.
   - Boundary validation present (Zod or equivalent).
   - SOLID / SRP / DRY; early returns; lookup objects over if-chains.
   - CRUD consistency; one authoritative persistence path per aggregate.
   - Tests cover new behaviour; mocks only when unavoidable.
   - Naming / imports / exports follow conventions.
   - Frontend: small reusable components, Tailwind only, accessibility first.
   - Data: SQL-first, indexes for real access patterns, schema intent only.
7. Surface checks based on `impacted_surfaces`:
   - Beads touching `packages/auth/**`: shared auth contracts live in ONE shared package. Cookie/token settings explicit. No parallel session store.
   - Beads touching `apps/api/**`: auth enforced via `protectedProcedure` / role-scoped helpers; session/user/role types from the shared auth package.
   - Beads touching `apps/web/**`: auth UX consumes auth hooks/guards — Google/Apple OAuth + anonymous Skip only; no email/password sign-in UI.
   - Beads touching `packages/db/**`: auth-table changes match what auth package expects; FK/intent consistent with access patterns.
8. Architecture sanity: layer boundaries respected; coupling not increasing; patterns earn their keep.
9. Post results — no performative agreement, never "absolutely right!":
   - PASS: `bd comments add <task> --author qa "PASS: validator ok; {BUILD_CMD}/{TEST_CMD}/{LINT_CMD} green on PR branch <name>; standards + scope audit clean; architecture: <one-line>; merging."`
   - FAIL: `bd comments add <task> --author qa "FAIL: [exact failing command output / standards violation file:line / scope violation / architectural concern]"`
10. PASS → run `bash agents/lib/merge-and-close.sh <task> qa` to squash-merge and close.
    FAIL → `bd update <task> --status in_progress` with a clear repro.

# Pass 2 — Architecture escalations
For any bead tagged `arch` or where an implementer requests an architectural decision:
- Decide the design or boundary question (layer separation, pattern selection, coupling/cohesion).
- Post the decision as a bead comment with explicit rationale and rejected alternatives.
- Do not write code; the implementer applies the decision.
- Never claim literal "100% confidence". State assumptions and accepted failure modes.

# Pass 3 — Knowledge-base capture
At end of each pass:
1. Query `bd list --status closed --json`.
2. For each newly completed bead not yet recorded in `$PROJECT_ROOT/knowledge-base.md`, append:
   ```
   ## [YYYY-MM-DD HH:MM] <bead-id> — <bead-title>
   **Status:** closed
   **Source:** <intake_bead / source_file / source_section if available>
   **Summary:** <one-sentence description from DONE comment>
   **Files changed:** <list if mentioned in DONE comment>
   ```
3. Create the file with heading `# $PROJECT_NAME — Knowledge Base` if it does not yet exist.
4. Track processed bead IDs in `agents/qa/scribe-state.json` to avoid double-processing.

# Boundaries
- Do NOT write or edit application code.
- Do NOT claim engineering beads.
- Do NOT approve work you have not independently tested and audited.
- Do NOT create implementation beads (product-owner owns that).
- Do NOT close beads without a PASS comment and `merge-and-close.sh`.
- Do NOT skip the tester gate — every passing bead transitions to `ready_for_test` (for projects with tester lane).
- Do NOT claim literal "100% confidence".

{SHARED}
""")

with open(f"{AGENTS_ROOT}/agents/tester/AGENTS.md", "w") as f:
    f.write("""# Identity
You are **tester**, the post-merge integration tester for {PROJECT_NAME}.
You exercise the merged slice end-to-end on a fresh checkout of main. You never write
application code and never create implementation beads.

# Project
Root: {PROJECT_ROOT}.

# bd CLI
Run `bd prime` at session start. Read `.agents/skills/beads/SKILL.md` before any `bd` op.

# Workflow
1. Poll `bd list --status ready_for_test --json` for beads qa has merged.
2. Claim: `bd update <bead-id> --status in_test`.
3. Pull origin/main; install via {PKG_MANAGER}; run repository verification (`{PKG_MANAGER} build`, `{PKG_MANAGER} test`, `{PKG_MANAGER} lint:fix`).
4. Execute the bead's declared `maestro_flows` (or stack-appropriate e2e suite). Honour `impacted_surfaces` for targeted smoke coverage.
5. Run `bash agents/lib/evidence-validator.sh <bead-id>` — must exit 0.
6. Post result — never performative:
   - PASS: `bd comments add <bead-id> --author tester "PASS: integration suite + maestro green on main @ <sha>. Closing."`
   - FAIL: `bd comments add <bead-id> --author tester "FAIL: <exact failing test / repro / commit sha>"`.
7. PASS → `bd update <bead-id> --status closed`. FAIL → `bd update <bead-id> --status in_progress` and reassign to the original implementer.

# Boundaries
- Do NOT write or edit application code.
- Do NOT skip the maestro/e2e suite when `maestro_flows` is set.
- Do NOT close a bead before integration suite has actually run green on main.
- Do NOT claim literal "100% confidence".

{SHARED}
""")

# Substitute variables in all AGENTS.md files
_SUBS = {
    "{PROJECT_NAME}": PROJECT_NAME,
    "{PROJECT_ROOT}": PROJECT_ROOT,
    "{PKG_MANAGER}": PKG_MANAGER,
    "{BUILD_CMD}": BUILD_CMD,
    "{TEST_CMD}": TEST_CMD,
    "{LINT_CMD}": LINT_CMD,
    "{VERIFY_ALL}": VERIFY_ALL,
    "{SHARED}": SHARED,
}
for _agent in ["boss", "manager", "product-owner", "dev-1", "dev-2", "dev-3", "qa", "tester"]:
    _path = f"{AGENTS_ROOT}/agents/{_agent}/AGENTS.md"
    with open(_path) as _f:
        _content = _f.read()
    for _k, _v in _SUBS.items():
        _content = _content.replace(_k, _v)
    with open(_path, "w") as _f:
        _f.write(_content)

PYEOF

# ── Write run.sh for each agent (pi CLI: boss interactive, workers -p loop) ──
for AGENT in "${AGENT_LIST[@]}"; do
  cat > "${AGENTS_ROOT}/agents/$AGENT/run.sh" << 'RUNEOF'
#!/usr/bin/env bash
export PATH="${HOME}/.local/bin:${HOME}/.cursor/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

cd "$(dirname "$0")"
LANE_DIR="$(pwd)"
ROOT_DIR="$(cd ../.. && pwd)"
_AGENT="$(basename "$LANE_DIR")"

_resolve_cli() {
  if command -v pi >/dev/null 2>&1; then
    command -v pi
    return 0
  fi
  echo "[$_AGENT] pi CLI not found in PATH" >&2
  return 1
}

PI_BIN="$(_resolve_cli)" || exit 127
_PROMPT_FILE="$LANE_DIR/prompt.txt"
_SYSTEM_PROMPT="$(cat "$_PROMPT_FILE")"

cd "$ROOT_DIR"

# Per-lane session storage (boss persistent, workers ephemeral).
_SESSION_DIR="$LANE_DIR/.pi-sessions"
mkdir -p "$_SESSION_DIR"

# Boss: interactive — single attached pi session, no -p, no loop.
# --continue resumes the most recent boss session if one exists; otherwise pi
# starts a fresh session and writes it to $_SESSION_DIR.
if [[ "$_AGENT" == "boss" ]]; then
  echo "[pi-agent][boss] launching interactive session in $ROOT_DIR"
  _BOSS_ARGS=(
    --append-system-prompt "$_SYSTEM_PROMPT"
    --session-dir "$_SESSION_DIR"
  )
  if compgen -G "$_SESSION_DIR/*.json" >/dev/null; then
    _BOSS_ARGS+=(--continue)
  fi
  exec "$PI_BIN" "${_BOSS_ARGS[@]}"
fi

# Workers: non-interactive patrol loop with ephemeral sessions.
echo "[pi-agent][$_AGENT] starting staged 10s..."
sleep 10

_LOOP="${PI_AGENT_LOOP_SLEEP:-45}"
while true; do
  echo "[pi-agent][$_AGENT] patrol $(date -u +"%Y-%m-%dT%H:%M:%SZ")..."
  "$PI_BIN" \
    -p \
    --no-session \
    --append-system-prompt "$_SYSTEM_PROMPT" \
    "patrol your lane: pick up any work assigned to $_AGENT, follow your AGENTS.md workflow, then exit." || true
  echo "[pi-agent][$_AGENT] sleeping ${_LOOP}s (override with env PI_AGENT_LOOP_SLEEP)"
  sleep "$_LOOP"
done
RUNEOF
  chmod +x "${AGENTS_ROOT}/agents/$AGENT/run.sh"
  cp "${AGENTS_ROOT}/agents/$AGENT/AGENTS.md" "${AGENTS_ROOT}/agents/$AGENT/prompt.txt"
done

# ── Write shared lib scripts ──────────────────────────────────────────────────
cat > "$AGENTS_ROOT/agents/lib/evidence-validator.sh" <<'VALIDATOR_EOF'
#!/usr/bin/env bash
# evidence-validator.sh — gate ready_for_qa transitions on machine-checkable DONE evidence.
# Usage: bash agents/lib/evidence-validator.sh <bead-id>
# Exit 0: evidence sufficient (branch + PR + verification commands)
# Exit 1: bead id not provided / bd unavailable / bead not found
# Exit 2: evidence missing

set -euo pipefail

BEAD_ID="${1:-}"

if [[ -z "$BEAD_ID" ]]; then
  echo "evidence-validator: usage: bash agents/lib/evidence-validator.sh <bead-id>" >&2
  exit 1
fi

if ! command -v bd >/dev/null 2>&1; then
  echo "evidence-validator: bd CLI not found in PATH; cannot verify evidence." >&2
  exit 1
fi

COMMENTS_JSON=$(bd comments list "$BEAD_ID" --json 2>/dev/null || true)
if [[ -z "$COMMENTS_JSON" || "$COMMENTS_JSON" == "null" ]]; then
  echo "evidence-validator: no comments found on bead $BEAD_ID" >&2
  exit 2
fi

PY_SCRIPT=$(cat <<'PY'
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
items = data if isinstance(data, list) else data.get("comments", [])
texts = []
for c in items:
    body = c.get("body") or c.get("text") or c.get("message") or ""
    if "DONE" in body.upper():
        texts.append(body)
print("\n---\n".join(texts))
PY
)
DONE_TEXT=$(printf '%s' "$COMMENTS_JSON" | python3 -c "$PY_SCRIPT" 2>/dev/null || true)

if [[ -z "$DONE_TEXT" ]]; then
  echo "evidence-validator: no DONE comment found on bead $BEAD_ID" >&2
  exit 2
fi

MISSING=()

if ! grep -Eqi 'branch[[:space:]]*[:=]?[[:space:]]*[A-Za-z0-9._/-]+' <<<"$DONE_TEXT"; then
  MISSING+=("branch name (e.g. 'Branch: feat/bd-123-slug')")
fi

if ! grep -Eqi '(PR|MR|pull[[:space:]]*request)[[:space:]]*[:=#]?[[:space:]]*([0-9]+|https?://[^[:space:]]+)' <<<"$DONE_TEXT"; then
  MISSING+=("PR/MR reference or URL (e.g. 'PR: https://github.com/org/repo/pull/42')")
fi

if ! grep -Eqi '(yarn|npm|pnpm|bun)[[:space:]]+(build|test|lint|typecheck)|vitest|pytest|cargo[[:space:]]+(build|test)|go[[:space:]]+test' <<<"$DONE_TEXT"; then
  MISSING+=("verification commands (e.g. 'Verified with: <pkg-manager> build, <pkg-manager> test, <pkg-manager> lint:fix')")
fi

if (( ${#MISSING[@]} > 0 )); then
  echo "evidence-validator: bead $BEAD_ID DONE comment missing required evidence:" >&2
  for m in "${MISSING[@]}"; do echo "  - $m" >&2; done
  echo "" >&2
  echo "DONE comment text seen:" >&2
  echo "$DONE_TEXT" | sed 's/^/    /' >&2
  exit 2
fi

echo "evidence-validator: bead $BEAD_ID OK (branch + PR + verification commands found)"
exit 0
VALIDATOR_EOF
chmod +x "$AGENTS_ROOT/agents/lib/evidence-validator.sh"

# Write bead-uniqueness.sh
cat > "$AGENTS_ROOT/agents/lib/bead-uniqueness.sh" <<'UNIQUENESS_EOF'
#!/usr/bin/env bash
# bead-uniqueness.sh — prevent duplicate child bead creation.
# Usage:
#   bash agents/lib/bead-uniqueness.sh "<title>" "<surfaces csv>"  # before create
#   bash agents/lib/bead-uniqueness.sh lock-check <bead-id>         # pre-claim check
set -euo pipefail

COMMAND="${1:-}"
shift

if [[ "$COMMAND" == "lock-check" ]]; then
  BEAD_ID="${1:-}"
  if [[ -z "$BEAD_ID" ]]; then
    echo "bead-uniqueness: usage: lock-check <bead-id>" >&2
    exit 1
  fi
  # Simple lock check: if another in-progress bead touches the same critical surface
  # (db/** or auth/**), reject. Extend this with real critical-surface detection as needed.
  echo "bead-uniqueness: lock-check for $BEAD_ID — pass (critical-surface lock not yet implemented)"
  exit 0
fi

TITLE="${1:-}"
SURFACES="${2:-}"

if [[ -z "$TITLE" ]]; then
  echo "bead-uniqueness: usage: <title> <surfaces csv>" >&2
  exit 1
fi

if ! command -v bd >/dev/null 2>&1; then
  echo "bead-uniqueness: bd not available — skipping uniqueness check" >&2
  exit 0
fi

# Normalize title for comparison
NORM_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr -s ' ' | sed 's/^ *//;s/ *$//')

LIVE_BEADS=$(bd list --status in_progress --status open --json 2>/dev/null || echo "[]")
TITLE_CONFLICT=$(echo "$LIVE_BEADS" | python3 -c "
import json, sys
try:
    beads = json.load(sys.stdin)
    titles = [b.get('title','').lower() for b in beads]
    for t in titles:
        norm = ''.join(c for c in t if c.isalnum() or c == ' ')
        if norm == '$NORM_TITLE':
            print('conflict')
            sys.exit(0)
    sys.exit(1)
except:
    sys.exit(1)
" 2>/dev/null || echo "")

if [[ "$TITLE_CONFLICT" == "conflict" ]]; then
  echo "bead-uniqueness: title conflict detected — exiting 2 (do not create)" >&2
  exit 2
fi

echo "bead-uniqueness: OK"
exit 0
UNIQUENESS_EOF
chmod +x "$AGENTS_ROOT/agents/lib/bead-uniqueness.sh"

# Write merge-and-close.sh
cat > "$AGENTS_ROOT/agents/lib/merge-and-close.sh" <<'MERGE_EOF'
#!/usr/bin/env bash
# merge-and-close.sh — qa merges PR and closes bead.
# Usage: bash agents/lib/merge-and-close.sh <bead-id> <actor>
# Actor is the agent performing the merge (qa or manager-fallback).
set -euo pipefail

BEAD_ID="${1:-}"
ACTING_AGENT="${2:-qa}"

if [[ -z "$BEAD_ID" ]]; then
  echo "merge-and-close: usage: bash agents/lib/merge-and-close.sh <bead-id> <actor>" >&2
  exit 1
fi

if ! command -v bd >/dev/null 2>&1; then
  echo "merge-and-close: bd not available — cannot proceed" >&2
  exit 1
fi

# Extract branch name + PR URL from DONE comment
DONE_JSON=$(bd comments list "$BEAD_ID" --json 2>/dev/null || echo "[]")
BRANCH=$(echo "$DONE_JSON" | python3 -c "
import json, sys
for c in json.load(sys.stdin):
    body = c.get('body','')
    if 'DONE' in body.upper():
        import re
        m = re.search(r'branch[:\s]+([A-Za-z0-9._/-]+)', body, re.I)
        if m: print(m.group(1))
" 2>/dev/null || echo "")

PR_URL=$(echo "$DONE_JSON" | python3 -c "
import json, sys
for c in json.load(sys.stdin):
    body = c.get('body','')
    if 'DONE' in body.upper():
        import re
        m = re.search(r'(https?://[^\s]+/pull/[0-9]+)', body, re.I)
        if not m:
            m = re.search(r'PR[:\s]+([0-9]+)', body, re.I)
        if m: print(m.group(0))
" 2>/dev/null || echo "")

if [[ -z "$BRANCH" ]]; then
  echo "merge-and-close: could not extract branch from DONE comment on bead $BEAD_ID" >&2
  exit 2
fi

# Attempt merge (gh or git-based — adapt to repo's merge strategy)
if command -v gh >/dev/null 2>&1; then
  echo "merge-and-close: attempting gh pr merge for $BEAD_ID..."
  gh pr merge --admin --delete-branch 2>/dev/null && echo "merge-and-close: merged" || {
    echo "merge-and-close: gh merge failed — check manually" >&2
    exit 3
  }
else
  echo "merge-and-close: gh not available — manual merge required for branch $BRANCH" >&2
  exit 3
fi

# Close bead
bd update "$BEAD_ID" --status closed
bd comments add "$BEAD_ID" --author "$ACTING_AGENT" "Merged and closed by $ACTING_AGENT via merge-and-close.sh."
echo "merge-and-close: bead $BEAD_ID closed"
exit 0
MERGE_EOF
chmod +x "$AGENTS_ROOT/agents/lib/merge-and-close.sh"

# Write run-all.sh — workers in tabs or background; boss foreground in current terminal
cat > "$AGENTS_ROOT/agents/run-all.sh" <<'RUNALLEOF'
#!/usr/bin/env bash
# run-all.sh — spawn worker agent loops, then run boss interactively in this terminal.
#
# Usage: bash agents/run-all.sh [--mode tabs|background] [--no-boss]
#
# Modes:
#   tabs        Open a new terminal tab per worker (macOS Ghostty / iTerm2 /
#               Terminal.app — auto-detected via TERM_PROGRAM).
#               Falls back to "background" if no supported terminal is detected.
#   background  Run each worker as a backgrounded child of this script (default).
#
# Boss:
#   By default boss runs in the foreground of THIS terminal so the developer can
#   chat with it. Pass --no-boss (or set RUN_ALL_AGENTS_NO_BOSS=1) to skip boss
#   entirely — useful when only the worker swarm is needed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="background"
NO_BOSS=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)        MODE="${2:-background}"; shift 2 ;;
    --mode=*)      MODE="${1#--mode=}";     shift ;;
    --tabs)        MODE="tabs";             shift ;;
    --background)  MODE="background";       shift ;;
    --no-boss)     NO_BOSS=1;               shift ;;
    -h|--help)
      sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "[run-all] unknown argument: $1" >&2
      exit 1 ;;
  esac
done

if [[ "${RUN_ALL_AGENTS_NO_BOSS:-}" == "1" ]]; then
  NO_BOSS=1
fi

WORKERS=(dev-1 dev-2 dev-3 manager product-owner qa tester)

# ── background mode ─────────────────────────────────────────────────────────
PIDS=()
_cleanup_bg() {
  local pid
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done
}

_spawn_background() {
  local name="$1"
  (
    cd "$ROOT/agents/$name"
    exec bash run.sh
  ) &
  local pid=$!
  PIDS+=("$pid")
  echo "[run-all] started $name in background (pid $pid)"
}

# ── tabs mode (macOS Terminal.app / iTerm2 / Ghostty) ───────────────────────
_detect_terminal() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "unsupported"
    return
  fi
  case "${TERM_PROGRAM:-}" in
    ghostty|Ghostty) echo "ghostty" ;;
    iTerm.app)       echo "iterm" ;;
    Apple_Terminal)  echo "terminal" ;;
    *)
      # Probe for Ghostty.app even when TERM_PROGRAM is unset (e.g. tmux/zellij).
      if [[ -d "/Applications/Ghostty.app" ]] || command -v ghostty >/dev/null 2>&1; then
        echo "ghostty"
      else
        echo "terminal"
      fi ;;
  esac
}

_spawn_tab_terminal() {
  local name="$1"
  /usr/bin/osascript <<APPLESCRIPT >/dev/null
tell application "Terminal"
  activate
  do script "cd '$ROOT/agents/$name' && exec bash run.sh"
end tell
APPLESCRIPT
  echo "[run-all] opened Terminal.app tab for $name"
}

_spawn_tab_iterm() {
  local name="$1"
  /usr/bin/osascript <<APPLESCRIPT >/dev/null
tell application "iTerm"
  tell current window
    set newTab to (create tab with default profile)
    tell current session of newTab
      write text "cd '$ROOT/agents/$name' && exec bash run.sh"
    end tell
  end tell
end tell
APPLESCRIPT
  echo "[run-all] opened iTerm2 tab for $name"
}

# Ghostty has no AppleScript surface, but it ships a "+new-tab" IPC subcommand
# (when run from inside an existing Ghostty session) and accepts --command /
# --working-directory at launch time. We try IPC first (real tab), then fall
# back to System Events Cmd+T + keystroke, then to a new Ghostty window.
_spawn_tab_ghostty() {
  local name="$1"
  local lane_dir="$ROOT/agents/$name"
  local cmd="cd '$lane_dir' && exec bash run.sh"

  if command -v ghostty >/dev/null 2>&1; then
    if ghostty +new-tab --working-directory="$lane_dir" --command="bash run.sh" >/dev/null 2>&1; then
      echo "[run-all] opened Ghostty tab (IPC) for $name"
      return
    fi
  fi

  # Fallback: drive Ghostty via System Events (requires Accessibility permission).
  if /usr/bin/osascript <<APPLESCRIPT >/dev/null 2>&1
tell application "Ghostty" to activate
delay 0.15
tell application "System Events"
  keystroke "t" using {command down}
  delay 0.25
  keystroke "$cmd"
  key code 36
end tell
APPLESCRIPT
  then
    echo "[run-all] opened Ghostty tab (System Events) for $name"
    return
  fi

  # Last resort: spawn a new Ghostty window via `open`. macOS will group as a
  # tab if "System Settings → Desktop & Dock → Prefer tabs: Always" is set.
  open -na "Ghostty" --args --working-directory="$lane_dir" --command="bash run.sh" >/dev/null 2>&1 || {
    echo "[run-all] failed to launch Ghostty for $name — install Ghostty or use --mode background" >&2
    return 1
  }
  echo "[run-all] opened Ghostty window for $name (set macOS 'Prefer tabs: Always' to group as tabs)"
}

# ── dispatch workers ────────────────────────────────────────────────────────
if [[ "$MODE" == "tabs" ]]; then
  TERM_KIND="$(_detect_terminal)"
  if [[ "$TERM_KIND" == "unsupported" ]]; then
    echo "[run-all] tabs mode only supported on macOS — falling back to background." >&2
    MODE="background"
  fi
fi

if [[ "$MODE" == "tabs" ]]; then
  for lane in "${WORKERS[@]}"; do
    case "$TERM_KIND" in
      ghostty)  _spawn_tab_ghostty "$lane" ;;
      iterm)    _spawn_tab_iterm "$lane" ;;
      *)        _spawn_tab_terminal "$lane" ;;
    esac
  done
elif [[ "$MODE" == "background" ]]; then
  trap _cleanup_bg EXIT INT TERM HUP
  for lane in "${WORKERS[@]}"; do
    _spawn_background "$lane"
  done
else
  echo "[run-all] unknown mode: $MODE (expected tabs|background)" >&2
  exit 1
fi

# ── boss in current terminal ────────────────────────────────────────────────
if [[ "$NO_BOSS" == "1" ]]; then
  if [[ "$MODE" == "background" ]]; then
    echo "[run-all] ${#PIDS[@]} worker(s) running in background. Ctrl+C to stop."
    wait
  else
    echo "[run-all] workers launched in tabs. This script exits; close tabs manually to stop."
  fi
  exit 0
fi

echo "[run-all] launching boss in this terminal — Ctrl+C exits boss."
if [[ "$MODE" == "background" ]]; then
  echo "[run-all] background workers will be terminated when boss exits."
fi
cd "$ROOT/agents/boss"
exec bash run.sh
RUNALLEOF
chmod +x "$AGENTS_ROOT/agents/run-all.sh"

# ── VSCode tasks.json ──────────────────────────────────────────────────────────
if [[ "$VSC" == true ]]; then
  mkdir -p "$AGENTS_ROOT/.vscode"
  TASK_BLOCKS=""
  DEPENDS_ON=""
  FIRST=true
  for AGENT in "${AGENT_LIST[@]}"; do
    if [[ "$FIRST" == true ]]; then
      FIRST=false
    else
      TASK_BLOCKS+=","
    fi
    TASK_BLOCKS+=$(cat <<TASK_EOF

    {
      "label": "agent:$AGENT",
      "type": "shell",
      "command": "cd agents/$AGENT && ./run.sh",
      "options": { "cwd": "\${workspaceFolder}" },
      "presentation": { "panel": "new", "title": "$AGENT" },
      "problemMatcher": []
    }
TASK_EOF
)
    if [[ -n "$DEPENDS_ON" ]]; then DEPENDS_ON+=", "; fi
    DEPENDS_ON+="\"agent:$AGENT\""
  done

  cat > "$AGENTS_ROOT/.vscode/tasks.json" <<EOF
{
  "version": "2.0.0",
  "tasks": [$TASK_BLOCKS
    {
      "label": "Launch All Agents",
      "dependsOn": [$DEPENDS_ON],
      "dependsOrder": "parallel",
      "problemMatcher": []
    }
  ]
}
EOF
  echo "  ✓ .vscode/tasks.json"
fi

# ── Provider-specific agent config (--provider) ───────────────────────────────
if [[ -n "$PROVIDER" ]]; then
  case "$PROVIDER" in
    claude)
      mkdir -p "$AGENTS_ROOT/.claude"
      cat > "$AGENTS_ROOT/.claude/CLAUDE.md" <<PROVIDER_EOF
# $PROJECT_NAME — Claude Code workspace

Read \`agents/SKILLS.md\` FIRST every session — it lists every repo-local skill
under \`.agents/skills/\` and the lane each one applies to.

For any session in this repo, your operating contract is the union of:

1. \`agents/<your-lane>/AGENTS.md\` — your role and workflow.
2. \`.agents/skills/<id>/SKILL.md\` — every skill triggered by the bead's
   \`impacted_surfaces\` metadata (read BEFORE any substantive action).
3. \`agents/SKILLS.md\` — the always-on skill list per lane.

Always run \`bd prime\` at the start of every session.

Package manager: \`$PKG_MANAGER\`. Verification gate: \`$PKG_MANAGER build && $PKG_MANAGER test && $PKG_MANAGER lint:fix\`.
PROVIDER_EOF
      echo "  ✓ .claude/CLAUDE.md"
      ;;
    codex)
      cat > "$AGENTS_ROOT/AGENTS.md" <<PROVIDER_EOF
# $PROJECT_NAME — Codex workspace contract

Read \`agents/SKILLS.md\` FIRST every session. Then read your lane's
\`agents/<lane>/AGENTS.md\` and every \`.agents/skills/<id>/SKILL.md\` triggered
by the current bead's \`impacted_surfaces\` metadata.

Run \`bd prime\` at the start of every session. Package manager: \`$PKG_MANAGER\`.
PROVIDER_EOF
      echo "  ✓ AGENTS.md (root, for codex)"
      ;;
    cursor|cursor-provider)
      mkdir -p "$AGENTS_ROOT/.cursor/rules"
      cat > "$AGENTS_ROOT/.cursor/rules/agents.mdc" <<PROVIDER_EOF
---
description: $PROJECT_NAME agent + skill contract
globs:
  - "**/*"
alwaysApply: true
---

# $PROJECT_NAME — Cursor workspace

Read \`agents/SKILLS.md\` FIRST every session. Then read your lane's
\`agents/<lane>/AGENTS.md\` and every \`.agents/skills/<id>/SKILL.md\` triggered
by the current bead's \`impacted_surfaces\` metadata.

Run \`bd prime\` at the start of every session. Package manager: \`$PKG_MANAGER\`.
Verification gate: \`$PKG_MANAGER build && $PKG_MANAGER test && $PKG_MANAGER lint:fix\`.
PROVIDER_EOF
      echo "  ✓ .cursor/rules/agents.mdc"
      ;;
    pi)
      mkdir -p "$AGENTS_ROOT/.pi"
      cat > "$AGENTS_ROOT/.pi/PI.md" <<PROVIDER_EOF
# $PROJECT_NAME — pi-agent-cli workspace

Read \`agents/SKILLS.md\` FIRST every session — it lists every repo-local skill
under \`.agents/skills/\` and the lane each one applies to.

For any session in this repo, your operating contract is the union of:

1. \`agents/<your-lane>/AGENTS.md\` — your role and workflow (loaded as the prompt
   by \`pi agent run <lane>\`).
2. \`.agents/skills/<id>/SKILL.md\` — every skill triggered by the bead's
   \`impacted_surfaces\` metadata (read BEFORE any substantive action).
3. \`agents/SKILLS.md\` — the always-on skill list per lane.

Always run \`bd prime\` at the start of every session.

Package manager: \`$PKG_MANAGER\`. Verification gate: \`$PKG_MANAGER build && $PKG_MANAGER test && $PKG_MANAGER lint:fix\`.

## Lane invocation

\`\`\`bash
pi agent run <lane> --workspace "\$ROOT_DIR" "\$(cat agents/<lane>/prompt.txt)"
\`\`\`

The canonical loop wrapper lives at \`agents/<lane>/run.sh\`. Launch the full
swarm with \`bash agents/run-all.sh\` (boss interactive in current terminal;
workers in background or \`--mode tabs\`).
PROVIDER_EOF
      echo "  ✓ .pi/PI.md"
      ;;
    *)
      echo "  warning: unknown --provider '$PROVIDER' — skipping provider config"
      ;;
  esac
fi

# ── Warp launch config (--warp) ───────────────────────────────────────────────
if [[ "$WARP" == true ]]; then
  mkdir -p "$AGENTS_ROOT/.warp/launch_configurations"
  WARP_PANES=""
  for AGENT in "${AGENT_LIST[@]}"; do
    [[ -n "$WARP_PANES" ]] && WARP_PANES+=$'\n'
    WARP_PANES+="          - cwd: $AGENTS_ROOT/agents/$AGENT"$'\n'
    WARP_PANES+="            commands:"$'\n'
    WARP_PANES+="              - exec: ./run.sh"
  done
  cat > "$AGENTS_ROOT/.warp/launch_configurations/$PROJECT_NAME-agents.yaml" <<WARP_EOF
---
name: $PROJECT_NAME agents
windows:
  - tabs:
      - title: agents
        layout:
          split_direction: horizontal
          panes:
$WARP_PANES
WARP_EOF
  echo "  ✓ .warp/launch_configurations/$PROJECT_NAME-agents.yaml"
fi

# ── Initialize beads (bd) if available ────────────────────────────────────────
if [[ "$BD_AVAILABLE" == true ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Step 5 — Initializing beads (bd) in the project"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Initialize bd non-interactively
  BD_INIT_FLAGS=(
    --non-interactive
    --role maintainer
    --skip-agents
    --skip-hooks
    --quiet
  )

  if BD_NON_INTERACTIVE=1 bd init "${BD_INIT_FLAGS[@]}" 2>/dev/null; then
    echo "  ✓ beads initialized"

    # Set custom statuses
    REQUIRED_STATUSES="ready_for_qa,in_qa,ready_for_test,in_test"
    CURRENT_STATUSES=$(bd config get status.custom 2>/dev/null || true)
    CURRENT_STATUSES=$(echo "$CURRENT_STATUSES" | tr -d ' "')
    MISSING_STATUS=false
    IFS=',' read -ra REQUIRED_ARR <<< "$REQUIRED_STATUSES"
    for STATUS in "${REQUIRED_ARR[@]}"; do
      if [[ ",$CURRENT_STATUSES," != *",$STATUS,"* ]]; then
        MISSING_STATUS=true
        break
      fi
    done
    if [[ "$MISSING_STATUS" == true ]]; then
      bd config set status.custom "$REQUIRED_STATUSES" 2>/dev/null && echo "  ✓ custom statuses set" || echo "  ⚠ could not set custom statuses"
    else
      echo "  ✓ custom statuses already configured"
    fi
  else
    echo "  ⚠ bd init failed — skipping beads setup"
  fi
fi

# ── Final summary ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $PROJECT_NAME scaffolded successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Project structure:"
echo "  $PROJECT_NAME/"
echo "  ├── apps/"
if [[ "$FRONTEND" == "expo" ]]; then
echo "  │   ├── api/           # Hono + @geekmidas/constructs"
echo "  │   ├── auth/          # better-auth magic link + Hono"
echo "  │   └── app/           # Expo + NativeWind"
else
echo "  │   ├── api/           # Hono + @geekmidas/constructs"
echo "  │   ├── auth/          # better-auth magic link + Hono"
echo "  │   └── web/           # $FRONTEND"
fi
echo "  ├── packages/"
echo "  │   ├── models/        # Shared Zod schemas"
echo "  │   └── ui/            # Shared React components + Tailwind v4"
echo "  ├── agents/            # Beads agent infrastructure"
echo "  │   ├── boss/"
echo "  │   ├── manager/"
echo "  │   ├── product-owner/"
echo "  │   ├── dev-1/"
echo "  │   ├── dev-2/"
echo "  │   ├── dev-3/"
echo "  │   ├── qa/"
echo "  │   ├── tester/"
echo "  │   ├── lib/"
echo "  │   ├── SKILLS.md"
echo "  │   └── run-all.sh"
echo "  ├── .agents/skills/    # Repo-local skill definitions"
echo "  ├── docker-compose.yml # PostgreSQL 16$( [[ "$CACHE" == "true" ]] && echo " + Redis 7" )$( [[ "$MAILER" == "mailpit" ]] && echo " + Mailpit" || echo "")"
echo "  ├── gkm.config.ts      # Workspace config"
echo "  └── turbo.json         # Task orchestration"
echo ""
echo "📋 Next steps:"
echo ""
echo "  cd $PROJECT_NAME"
echo ""
echo "  # Start database services"
echo "  docker compose up -d"
echo ""
echo "  # Run worker agents in background + boss interactive in this terminal"
echo "  bash agents/run-all.sh"
echo "  # Or open one terminal tab per worker (macOS Ghostty / iTerm2 / Terminal.app)"
echo "  bash agents/run-all.sh --mode tabs"
echo ""
echo "  # Or start the dev server"
echo "  $PKG_MANAGER dev"
echo ""
echo "Agent roles:"
echo "  • boss — chat with developer; files intake beads to manager"
echo "  • manager — receives intake; hands to product-owner; patrols workflow"
echo "  • product-owner — decomposes intake into 4-12+ small vertical-slice beads"
echo "  • dev-1/2/3 — implement one bead end-to-end"
echo "  • qa — code review + architecture + merge + knowledge capture"
echo "  • tester — post-merge integration tester on main"
echo ""
echo "Be sure to read agents/SKILLS.md and your lane's agents/<lane>/AGENTS.md at session start."