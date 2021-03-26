# Graphql Server Template

[GitLab version with CI CD](https://gitlab.com/FMadruga/graphql_server_template)

## Requirements
* Node
* Redis
* postgreSQL

**Optional**
* Docker
* Docker Compose

## How to run
### First option
1 - Install dependecies
```
npm install
```
2 - Create a ```.env``` file

Example:
```
NODE_ENV=dev
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/khyber
SERVER_PORT=8080
REDIS_URL=127.0.0.1:6379
COOKIE_NAME=qid
FORGET_PASSWORD_PREFIX=forget-password:
SESSION_SECRET=1234567890abcdefgh
```
3 - Compile the code to JavaScript
```
npm run build
```
4 - Start server
```
npm run start
```

### Second option - using docker
Use docker-compose to start server
```
npm run docker:compose:up
```

## Development enviroment
### Code formatting
ESlint to format your code
### Auto compile and run on file change
Use the following script in one terminal to auto compile your code when you change a file
```
npm run watch
```
Use the following script in another terminal to auto run the compiled code
```
npm run dev
```

# Tests
To run your test use
```
npm run test
```
If you also want to know your coverage run
```
npm run coverage
```
