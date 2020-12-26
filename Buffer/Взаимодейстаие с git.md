---
modified: 2020-12-26T08:53:33+03:00
---

# # Отправка данных на репозиторий

~~~bash
git add *
git commit -m "Commit"
git push git@github.com:Denis-VR/BrainNet.git master
~~~

Также можно использовать скрипт out.sh с помощью:
```bash
./out.sh
```

##  Получение данных с репозиторий
```bash
git pull git@github.com:Denis-VR/BrainNet.git
```

Или так:
```bash
./in.sh
```