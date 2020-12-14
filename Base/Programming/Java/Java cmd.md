status: В процессе
format: stage
tegs: #java #programming 
need to know: -

---

<cd /> перемещает нас в начало пути. 

<cd ..> перемещает нас на одну дирректорию левее. 

<cd (папка)> перемещает нас правее в указанную папку. 

<md (filaName)> - созать папку 

 

<javac (class).java> компилирует указанный файл в байт-код. 

<java (class)> запускает указанный класс. 

<javac -d (путь к папке)/(class).java> компилирует указанный класс в указанную папку  

<java -classpath ./bin (className) - позволяет запустить java программу (находящуюся в папку bin) из текущий папки 

<javac -sourcepath ./src -d bin src/com/qwertovsky/helloworld/HelloWorld.java> - компиляция программы, состоящей из нескольких классов (благодаря ключу -sourcepath) 

 

javac -g -sourcepath ./src -d bin src/com/qwertovsky/helloworld/HelloWorld.java - компиляция с возможностю отладки 

jdb -classpath bin -sourcepath src com.qwertovsky.helloworld.HelloWorld - запуск отладчика 

> stop at com.qwertovsky.helloworld.Calculator:9 - указать точку прерывания в 9 строке 

>run - запуск пограммы 

main[1] list - вывод куска кода. 

 

 

Создание исполняемого JAR-архива. 

добавтье в директорию с скомпелированными классами файл manifest.txt. 

Напишите в манифест строку: Main-Class: MyApp и нажмите enter. 

из директории с манифестом запустите манифест (с переходом на другую строку для успешного выполнения): 

jar -cvmf manifest.txt app1.jar *.class 

 

Но если ваши классы хранятся в пакете, то достаточно написать названия пакета: 

jar -cvmf manifest.txt app1.jar package 

 

Вывод списка содержимого и распаковка jar-архива 

Вывод содержимого: 

jar -tf packeg.jar 

Распаковка содержимого: 

jar -xf packeg.jar 