FROM node:16.17

WORKDIR /app

COPY ./app/package*.json ./
RUN npm install
COPY ./app ./

CMD ["npm", "start"]