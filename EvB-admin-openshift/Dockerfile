FROM node:lts-alpine
WORKDIR /usr/src/evb-admin
COPY . /usr/src/evb-admin/
RUN npm install
CMD ["npm", "start"]
EXPOSE 8080