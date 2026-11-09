# Build with the repository root as Docker context: docker build -f services/sandbox-worker/Dockerfile .
FROM mcr.microsoft.com/playwright:v1.49.1-noble
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate && pnpm install --no-frozen-lockfile
ENV NODE_ENV=production SANDBOX_PORT=4102 BIND_HOST=0.0.0.0
USER pwuser
EXPOSE 4102
CMD ["pnpm", "--filter", "@aegistrust/sandbox-worker", "start"]
