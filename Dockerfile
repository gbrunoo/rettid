FROM alpine:3.19

ARG TARGET

RUN apk add --no-cache curl

RUN curl -L "https://github.com/gbrunoo/redlib-revamped/releases/latest/download/rettid-${TARGET}.tar.gz" | \
    tar xz -C /usr/local/bin/

RUN adduser --home /nonexistent --no-create-home --disabled-password rettid
USER rettid

# Tell Docker to expose port 8080
EXPOSE 8080

# Run a healthcheck every minute to make sure rettid is functional
HEALTHCHECK --interval=1m --timeout=3s CMD wget --spider -q http://localhost:8080/settings || exit 1

CMD ["rettid"]

