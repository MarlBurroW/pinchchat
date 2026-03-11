# Stage 1: Build
FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_GATEWAY_WS_URL
ARG VITE_DEFAULT_AUTH_MODE
ARG VITE_CLIENT_ID
ENV VITE_GATEWAY_WS_URL=${VITE_GATEWAY_WS_URL}
ENV VITE_DEFAULT_AUTH_MODE=${VITE_DEFAULT_AUTH_MODE}
ENV VITE_CLIENT_ID=${VITE_CLIENT_ID}
RUN npm run build

# Stage 2: Serve
FROM nginx:bookworm
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
