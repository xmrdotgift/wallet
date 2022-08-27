FROM node:lts-bullseye-slim

COPY package.json package-lock.json ./
RUN npm i

COPY . .

CMD ["npm", "run", "serve"]