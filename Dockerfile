FROM node:24-alpine

WORKDIR /app

COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN npm --prefix Backend ci --omit=dev

COPY Backend ./Backend
COPY Frontend ./Frontend

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "--prefix", "Backend", "start"]
