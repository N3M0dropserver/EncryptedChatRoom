# Encrypted chat room site

A Project combining socket.io MongoDB Node and Express to make a simple encrypted web chat app.

**Live Example:** [https://chat.zacwesleybrown.com](https://chat.zacwesleybrown.com)

---
## Requirements

For development, you will only need Node.js. Optionally a node global package, Yarn which helps with
installing into your environement. and if you want to run the system containerized you will need docker

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.
    ```
      $ sudo apt install nodejs
      $ sudo apt install npm
    ```

- #### Node installation on Arch

  You can use pacman or even better yay (Yet Another Yaourt).
    ```
      $ sudo pacman -S nodejs
      $ sudo pacman -S npm
    ```
    ```
      $ yay nodejs
      $ yay npm
    ```

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v17.3.0

    $ npm --version
    8.5.1

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

### Docker installation

- #### Docker installation on Windows

  Just go on [Official Docker Docs website](https://docs.docker.com/desktop/windows/install/) and Follow the instructions

- #### Docker installation on Ubuntu

  You can install docker and docker-compose easily with apt install, just run the following commands.
    ```
      $ sudo apt-get install docker
      $ sudo apt-get install docker-compose
    ```

- #### Docker installation on Arch

  You can use pacman or even better yay (Yet Another Yaourt).
    ```
      $ sudo pacman -s docker
      $ sudo pacman -s docker-compose
    ```
    ```
      $ yay docker
      $ yay docker-compose
    ```

### Yarn installation
  After installing node, this project will need yarn too, so just run the following command.

    $ npm install -g yarn

---

## Configure app

There is no settings however there is a .env file. an example.env is provided but heres an outline
```
SECRET="Random Secret Here" 
DB_URI="mongodb://db:27017/encchat"
MODE="docker" or "local"
LOCAL_DB="mongodb://127.0.0.1:27017/encchat"
```
SECRET is the secret for the tokens etc. keep this secure and long and do not share it.

DB_URI is the url for the mongodb database in this case db refers to the docker container network db that is on the same network as the express server, this will be used if the MODE variable is set to "docker" or anything else othe than "local".

MODE is to determine between whether the server should be run in a docker container or locally and is mainly for the database connection.

LOCAL_DB is the url for the local mongodb instance this will be used if the MODE variable is set to "local".

feel free to make changes in `index.js`.

## Install
to run the system locally you can run:
```
$ git clone https://github.com/N3M0dropserver/EncryptedChatRoom
$ cd EncryptedChatRoom
and either:
$ npm install
$ yarn install
```
however for this you mut have mongo db running locally.

to install the system in docker just run:
```
$ docker compose build
```

## Running the project locally
Either:
```
$ yarn start
$ npm start
```
## Running the project in docker
```
$ docker compose up
```
---
## Todo
- Proper Diffie-Hellman key exchange between users.
- Chat can handle more than 2 users but not with encryption enabled so make it work with encryption.
- Better admin settings including kick and mute and ban and moderators etc.
- Better options panel when setting up the chat preferably when in the waiting room.
- Refactor some of the code for cleanliness and continued development.
