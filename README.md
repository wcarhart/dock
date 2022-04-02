<p align="center"><img alt="dock logo" src="public/logo.png" /></p>

<h1 align="center">dock</h1>
<h5 align="center">a good place to keep some tugboats</h5>

## Overview
Dock is a wrapper, manager, and secure web interface for [tug](https://github.com/wcarhart/tug).

## Usage

## Install

## FAQ

```bash
# set up dependencies
sudo useradd -m pm2
sudo passwd pm2 # pick strong password, don't check into Git
sudo usermod --shell /bin/bash pm2
sudo usermod -aG sudo pm2
sudo su pm2
cd
sudo apt-get update
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm --version # verify this works
nvm install 15.14.0 # or, pick desired version
npm install --global yarn
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
npm install --global pm2@latest
pm2 --version # verify this works

# install dock
mkdir -p code
cd code
git clone git@github.com:wcarhart/dock.git
cd dock
yarn install
# copy any necessary .env files to VM
# set up dock config.json as desired
sudo apt-get install certbot
sudo certbot certonly --manual # follow prompts
sudo chown -R pm2 /etc/letsencrypt
sudo chgrp -R pm2 /etc/letsencrypt/
yarn prod # verify this works, should see app at domain/IP
pm2 start yarn --name dock -- prod # verify this works, should see app at domain/IP
pm2 startup systemd
# this will spit out another command to run, make sure you run it VERBATIM
pm2 save
sudo reboot
```
After reboot, SSH back into the VM and continue.
```bash
sudo su pm2
cd
sudo systemctl start pm2-pm2
pm2 save
```