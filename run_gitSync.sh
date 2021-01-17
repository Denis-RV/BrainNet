#!/bin/bash

cd ~/Documents/Obsidian/All
./gitSync.sh

#Запуск Obsidian
/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=obsidian.sh --file-forwarding md.obsidian.Obsidian @@u %u @@

./gitSync.sh
