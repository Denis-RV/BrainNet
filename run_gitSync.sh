#!/bin/bash

#Синхронизация с 
#cd /home/danis/Documents/Obsidian/All/
/home/danis/Documents/Obsidian/All/gitSync.sh &

# git pull git@github.com:Denis-VR/BrainNet.git

# git add *
# git commit -m "$(date)"
# git push git@github.com:Denis-VR/BrainNet.git master

#Запуск Obsidian
/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=obsidian.sh --file-forwarding md.obsidian.Obsidian @@u %u @@

/home/danis/Documents/Obsidian/All/gitSync.sh 


#git pull git@github.com:Denis-VR/BrainNet.git

#git add *
#git commit -m "$(date)"
#git push git@github.com:Denis-VR/BrainNet.git master
