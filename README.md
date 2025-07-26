# Spike Desktop App - based on ElectronJS

This is a simple ElectronJS wrap for Spike WebApp, my email app of choice.
They do not have a Linux Desktop yet so I created one. 

## Run from code

You need NodeJS to run this. 

```bash
git clone https://github.com/rauldipeas/spike-desktop
cd spike-desktop
npm install
npm start
```

## Install on Ubuntu 24.04 (GNOME/Wayland)

```bash
npm run build
sudo apt install --reinstall ./dist/spike-desktop*.deb
```

## Thanks

To the [Spike](https://www.spikenow.com) team, as they deliver an amazing product.

To the [Electron](https://electronjs.org) team.

This wrap for the Spike WebApp has been created just forking the official [Electron Quickstart](https://github.com/electron/electron-quick-start) and getting some help from [Chat GPT](https://chatgpt.com).

## License

[CC0 1.0 (Public Domain)](LICENSE.md)