# Copyright 2018 NTT Group

# Permission is hereby granted, free of charge, to any person obtaining a copy of this 
# software and associated documentation files (the "Software"), to deal in the Software 
# without restriction, including without limitation the rights to use, copy, modify, 
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
# permit persons to whom the Software is furnished to do so, subject to the following 
# conditions:

# The above copyright notice and this permission notice shall be included in all copies 
# or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
# PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
# FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
# OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
# DEALINGS IN THE SOFTWARE.

# Note: This file requires access to the bluetooth stack of the host. For me this worked with
#       sudo docker run -t -i --rm --net=host okoeth/edge-anki-controller
#            
#       Useful link: https://stackoverflow.com/questions/28868393/accessing-bluetooth-dongle-from-inside-docker#36865509

FROM ubuntu:16.04

MAINTAINER Oliver Koeth "oliver.koeth@nttdata.com"

# Install basics
RUN apt-get -qq update && \
    apt-get -y dist-upgrade
RUN apt-get -y install git python-software-properties curl bluez bluetooth build-essential libssl-dev
RUN curl -sL https://deb.nodesource.com/setup_9.x -o node_install.sh
RUN bash node_install.sh
RUN apt-get -y install nodejs
RUN apt-get -y install g++ libusb-1.0-0-dev libudev-dev sasl2-bin

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

#RUN npm install node-rdkafka
RUN npm install

EXPOSE 8090

ENTRYPOINT ["node", "controller.js"]

CMD ["-c", "mounted-config/config-car1-i3-cloudwan.properties", "-t", "mounted-config/eight-i3.json", "-k", "mock"]
