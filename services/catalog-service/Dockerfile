FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm cache clean --force && rm -rf /root/.npm

COPY . .

EXPOSE 5002

CMD ["node", "src/index.js"]
