#!/bin/bash
git pull git@github.com:Denis-VR/BrainNet.git

git add *
git commit -m "$1"
git push git@github.com:Denis-VR/BrainNet.git obsidian_git

