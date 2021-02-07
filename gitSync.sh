#!/bin/bash

#Синхронизируемся с удаленным репозиторием перед загрузкой программы
cd /home/denis/Documents/BrainNet/
pwd
git pull git@github.com:Denis-VR/BrainNet.git

git add *
git commit -m "$(date)"
git push git@github.com:Denis-VR/BrainNet.git master
