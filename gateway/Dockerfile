FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm cache clean --force && rm -rf /root/.npm

COPY . .

EXPOSE 8000

CMD ["node", "src/index.js"]
