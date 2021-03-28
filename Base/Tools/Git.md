# Basics of Git & GitHub

Created: Oct 28, 2020 8:05 PM
status: Ready
format: flow
Tags:
need to know: [[Bash Syntax]]

![Basics%20of%20Git%20&%20GitHub%20a859a9b942214e4083d4e8ade3882b97/Untitled.png](Untitled.png)

### **Создание имени и почты**

(указываются для взаимодействия с сервером)

It is a good idea to introduce yourself to Git with your name and public email
address before doing any operation. The easiest way to do so is:

```bash
       $ git config --global user.name "Your Name Comes Here"
       $ git config --global user.email "you@yourdomain.example.com"
```

Подсоединиться к GitHub репозиторию можно двумя способами:

```bash
# С помощью http. В этом случае придется часто вводить пороли
$ git clone <HTTP copies> 

# С помощью SSH, но необходимо создать ключ. Создание ключа:
$ ssh-keygen #далее жмем enter, пока не будет создан ключ
# Затем заходим в созданную директорию (.ssh) находим
# файл id_rsa.pub и копируем его содержимое, которое вставляем в 
# гитхаб (SSH в настройках). Теперь мы можем клонировать репозиторий
# по ssh
```

### Просмотр действий

Все ваши действия сохраняются в файл **.gitconfig**

Файл находиться по этому пути:   ~/.gitconfig

Чтобы просмотреть содержимое, надо набрать такую команду:

```bash
			$ cat .gitconfig
```

### Подключение директории к git

Чтобы git начал следить за директорией и за всеми изменениями в ней, необходимо переместиться в эту директорию написать команду:

```bash
$ git init .
OR
$ (way to directory) git init .
```

### Команда для отслеживания статуса директории:

```bash
$ git status
```

### Commit (снимок или сохранение директории)

```bash
Firs step:
$ git add * - делает снимок всех файлов
$ git add file.txt - снимок одного файла

Second step:
$ git commit -m "My Initial commit, this is Version1.0"
```

Отправка репозитория на мастер-ветку и на сервер

```bash
$ git push origin
```

Stage:![Basics%20of%20Git%20&%20GitHub%20a859a9b942214e4083d4e8ade3882b97/Untitled%201.png](Images/Untitled%201.png)

Проверка истории всех коммитов:

```bash
$ git log
#просмотр последнего коммита
$ git log -l -p
```

Восстановление файла (если он был изменен)

```bash
$ git checkout --fileName
```

Показать, какие будут внесены изменения, относительно последнего коммита

```bash
$ git diff --staged
```

### Игнорирование файлов.

Чтобы заставить гит игнорировать файлы или директории, необходимо создать файл .gitignore и указать в нем, что надо игнорировать.

```bash
$nano .gitignore
#file.txt   (файл)
#*.log      (файлы формата log)
#logs/      (директория)
```

Создание и работа с Branch (ветвления)

```bash
$ git branch #show bhanshes
$ git branch fix_error #создание ветки с названием fix_error
$ git checkout fix_error #переход на ветку fix_error
$ git checkout -b test_branch #создание и переход на новую ветку
$ git branch -d fix_error #удаление ветки
$ git checkout -D test_branch #удаление ветки с коммитами
```

Откат версий:

```bash
#копируем код коммита и вставляем
$ git checkout 8f048b9280ba89a69122904ccf0e38c104024aeb
#Мы можем вернуться
$ git checkout main
```

Изменение старого коммита (в том числе комментария):

```bash
#делайте изменения
$ git commit --amend
#редактируйте и созраняйте.
```

Полный возврат к определенной версии с удалением новых

```bash
$ git reset --hard HEAD~ #вернуться на прошлый коммит
$ git reset --hard HEAD~2 #вернуться на два коммита назад

$ git reset --soft HEAD~ #удалить коммиты из лога, но оставить содержимое
#последней версии
```
[obsidian](https://obsidian.md/download)