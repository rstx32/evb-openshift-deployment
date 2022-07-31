FROM node:lts-slim
WORKDIR /usr/src/evb-node
COPY . /usr/src/evb-node/
RUN npm install
CMD ["npm", "start"]
EXPOSE 8080