FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Runtime image ----
FROM node:24-alpine AS runner
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Document the port the app listens on
EXPOSE 3000

# Start the server
CMD [ "node", "dist/index.mjs" ]