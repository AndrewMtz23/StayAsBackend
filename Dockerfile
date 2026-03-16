FROM node:20-alpine

WORKDIR /app

ARG DOCKER_DATABASE_URL
ENV DATABASE_URL=$DOCKER_DATABASE_URL

COPY package*.json ./

RUN npm install

COPY . .

# combinar RUN para cumplir con Sonar
RUN npx prisma generate && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

USER appuser

EXPOSE 3000

CMD ["npm", "start"]