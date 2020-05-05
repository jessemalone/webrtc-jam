FROM socialengine/nginx-spa:latest

RUN apt update -y
RUN apt install -y python3 python3-pip

COPY . /app
COPY ./nginx-site.conf /etc/nginx/conf.d/default.conf
RUN chmod -R 777 /app
RUN pip3 install -r /app/requirements.txt
RUN /app/app.py >>/app/app.log &

ENTRYPOINT ["/app/container-start.sh"]
CMD ["/usr/local/bin/start-container", "nginx"]
