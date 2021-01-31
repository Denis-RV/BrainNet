# tmux
*status:* In process
*format:* stage
*tegs:* #editText #linux #programming #java #html #python
*link:* https://habr.com/ru/hub/vim/
*desckription:* Терминальный мультиплексор. Позволяет разделять окна в терминале и быстро переключать сессии.


---
## Команды:
```bash
#Установка:
sudo apt install tmux

#Создание новой сесии с названием test:
tmux new-session test 

#Создание нескольких окон. Переключение происходит с помощью комбинации (Ctrl+B) + 0(1)
0 wondow #Жмем (Ctrl+B) + c
```
- (Ctrl + b) + % - разделение терминал по вертикали
- (Ctrl + b) + " - разделение терминал по горизонтали
- (Ctrl + b) + de - отсоединиться от сессии
- `tmux attach -t test` - присоединиться к сессии с названием test.

## Настройка
Для навстройки открываем файл:
`~/.tmux.conf`
И изменяем команду, которая переопределяет стандартную комбинацию (Ctrl + b) на (Ctrl + q)
`set-option -g prefix C-q`