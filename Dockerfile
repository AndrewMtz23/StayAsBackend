FROM node:20-alpine

WORKDIR /app

# variable para el build de Docker
ARG DOCKER_DATABASE_URL
ENV DATABASE_URL=$DOCKER_DATABASE_URL

# instalar dependencias
COPY package*.json ./

RUN npm install

# copiar código
COPY . .

# generar cliente de Prisma
RUN npx prisma generate

# crear usuario seguro
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 3000

CMD ["npm", "start"]