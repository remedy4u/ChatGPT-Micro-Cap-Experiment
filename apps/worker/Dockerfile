FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm install
RUN npm run build
CMD ["npm","--workspace","@mvp/worker","run","start"]
