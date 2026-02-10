# =====================================================
# KING ICE GOLD - Unified Dockerfile (Backend + Frontend)
# Serves both the API and static frontend from Express
# =====================================================
FROM node:20-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --only=production || npm install --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend static files
COPY frontend/ ./frontend/

# Copy database schema (for reference/seeding)
COPY database/ ./database/

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

# Start server
CMD ["node", "backend/server.js"]
