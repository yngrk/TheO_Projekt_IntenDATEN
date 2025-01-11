# Use an argument for the Node.js version
ARG NODE_VERSION=20.14.0

# Base image
FROM node:${NODE_VERSION}-slim as base

# Set the working directory and port
ARG PORT=3000
WORKDIR /src

# Build stage
FROM base as build

# Copy package files and install dependencies
COPY --link package.json package-lock.json ./
RUN npm install

# Copy the entire project
COPY --link . .

# Build the application
RUN npm run build

# Runtime stage
FROM base

# Set environment variables
ENV PORT=$PORT
ENV NODE_ENV=production

# Copy the built output
COPY --from=build /src/.output /src/.output

# **Copy the data files**
COPY --from=build /src/server/data /src/server/data

# Optional: Copy node_modules if necessary
# COPY --from=build /src/node_modules /src/node_modules

# Expose the port (optional, but recommended)
EXPOSE $PORT

# Start the application
CMD ["node", ".output/server/index.mjs"]
