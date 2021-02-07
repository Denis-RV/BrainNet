#!/bin/bash

#запуск скрипта для синхронизации
#git pull git@github.com:Denis-VR/BrainNet.git
#git add *
#git commit -m "$(date)"
#git push git@github.com:Denis-VR/BrainNet.git master
/home/denis/Documents/BrainNet/gitSync.sh &

#Запуск Obsidian
/opt/Obsidian/obsidian %U

/home/denis/Documents/BrainNet/gitSync.sh &
