# Deploying dock with PM2

To deploy dock with [PM2](https://pm2.keymetrics.io/), grab a VM/app instance from your favorite cloud provider and do the following.

First, set up dependencies.
```bash
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
sudo apt-get install certbot
# if you want to run tug on port 80, we need to give Node.js access to the
# restricted port using libcap2
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
npm install --global pm2@latest
pm2 --version # verify this works
```
Now, we need an SSL certificate. To acquire that, we will use [Certbot](). Follow the prompts from the `certbot` command (this will require an additional, simple HTTP server to prove you own the domain your registering, so be prepared to open another terminal to your VM).
```bash
sudo certbot certonly --manual
sudo chown -R pm2 /etc/letsencrypt
sudo chgrp -R pm2 /etc/letsencrypt/
```
If you need an additional, simple server for the Certbot command, I like to use [Python's `http` module](https://docs.python.org/3/library/http.server.html). You'll need `sudo` to run on port 80.
```bash
sudo python3 -m http.server 80
```
Next, install dock. Once you run `yarn dev`, you should see the application running from your VM's IP address or domain.
```bash
mkdir -p code
cd code
git clone git@github.com:wcarhart/dock.git
cd dock
yarn install
# copy your .env files to the VM
# set up dock config.json as desired
yarn dev # verify this works, should see app at domain/IP
```
Once the development setup is working, we can deploy the production HTTPS server.
```bash
cd ~/code/dock
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