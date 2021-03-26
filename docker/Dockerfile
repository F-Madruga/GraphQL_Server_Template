# global args
ARG WORK_DIR=/home/node/app
# builder image
FROM node:14.15.1-alpine AS builder
ARG WORK_DIR
WORKDIR $WORK_DIR
COPY ./tsconfig.json $WORK_DIR/
COPY ./package.json $WORK_DIR/
RUN npm install --production=false > /dev/null
COPY ./src $WORK_DIR/src
COPY ./.env.example $WORK_DIR/
RUN npm run build
# final image
FROM node:14.15.1-alpine
ARG WORK_DIR
WORKDIR $WORK_DIR
COPY --from=builder $WORK_DIR/node_modules $WORK_DIR/node_modules
COPY --from=builder $WORK_DIR/dist $WORK_DIR/dist
COPY --from=builder $WORK_DIR/package*.json $WORK_DIR/
COPY --from=builder $WORK_DIR/.env.example $WORK_DIR/
CMD [ "npm", "run", "start", "--silent" ]