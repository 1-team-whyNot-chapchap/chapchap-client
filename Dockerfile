FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
ARG VITE_GATEWAY_BASE_URL
ARG VITE_PRIMEUI_LICENSE
ARG VITE_PORTONE_STORE_ID
ARG VITE_PORTONE_IDENTITY_CHANNEL_KEY
RUN test -n "$VITE_GATEWAY_BASE_URL" && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
USER 101:101
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
