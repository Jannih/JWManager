# Base image with Node.js
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manager files and install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
    else \
    echo "Lockfile not found." && exit 1; \
    fi

# Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
    else \
    echo "Lockfile not found." && exit 1; \
    fi

# Final stage: Set up the runtime environment
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Set environment variables
ENV DATABASE_URI mongodb://127.0.0.1/jw-manager
ENV PAYLOAD_SECRET ef4205a74770a89125f30214
ENV NEXT_PUBLIC_SERVER_URL http://localhost:3000

# Create and set the application user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built files and necessary runtime files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Change ownership of the directories to the application user
RUN chown -R nextjs:nodejs .

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000
ENV PORT 3000

# Install pnpm globally
USER root
RUN npm install -g pnpm
USER nextjs

# Command to run the application
CMD ["pnpm", "start"]
