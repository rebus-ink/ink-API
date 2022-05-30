FROM node:14-alpine3.12

# Create app directory
# this is the location where you will be inside the container
WORKDIR /app

# Install app dependencies

# copying packages first helps take advantage of docker layers
COPY package*.json ./

# this first line is needed to access github dependencies
RUN apk add --no-cache git
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
