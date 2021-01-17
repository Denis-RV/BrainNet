#!/bin/bash

#Синхронизируемся с удаленным репозиторием перед загрузкой программы
git pull git@github.com:Denis-VR/BrainNet.git

git add *
git commit -m "$(date)"
git push git@github.com:Denis-VR/BrainNet.git master

/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=obsidian.sh --file-forwarding md.obsidian.Obsidian @@u %u @@

#синхронизируемся с удаленным репозитеорием после загрузки программы
git pull git@github.com:Denis-VR/BrainNet.git

git add *
git commit -m "$(date)"
git push git@github.com:Denis-VR/BrainNet.git master
