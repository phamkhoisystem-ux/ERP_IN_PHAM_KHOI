FROM node:24-alpine

WORKDIR /app

COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN npm --prefix Backend ci --omit=dev

COPY Backend ./Backend
COPY Frontend ./Frontend

ENV NODE_ENV=production
EXPOSE 4000

CMD BOOTSTRAP_ADMIN_USERNAME=adminipkerp BOOTSTRAP_ADMIN_PASSWORD=185cmT8@12345678 node Backend/scripts/bootstrap-admin.js && npm --prefix Backend start
