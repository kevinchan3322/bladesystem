FROM node:18.12.1-alpine

# make the 'app' folder the current working directory
WORKDIR /app

# # copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install
# # copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# install Python
RUN apk add --no-cache python3 py3-pip tzdata

# Set the timezone in environment
ENV TZ=Asia/Taipei

RUN pip install -r requirements.txt

CMD [ "npm", "start" ]