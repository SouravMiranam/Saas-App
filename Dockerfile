FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Expose dev port
EXPOSE 3000

# Start dev server with Turbopack
CMD ["npm", "run", "dev"]
