FROM node:lts-alpine
WORKDIR /usr/src/evb-validator
COPY . /usr/src/evb-validator/
RUN npm install
CMD ["npm", "start"]
EXPOSE 8080