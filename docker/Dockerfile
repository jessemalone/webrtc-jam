FROM jessemalone/webrtcjam-build:latest
RUN apt update && apt install -y nginx 
COPY . /app
COPY ./docker/nginx-site.conf /etc/nginx/sites-enabled/default
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
RUN chmod -R 777 /app

RUN /usr/local/bin/pip install -r /app/server/requirements.txt
RUN cd /app/server/; make test; cd ../..;

RUN cd /app/; npm install; npm test -- --watchAll=false; cd ..;

RUN /app/server/app.py >>/app/app.log &

ENTRYPOINT ["/app/docker/pre-start.sh"]
CMD ["nginx"]
