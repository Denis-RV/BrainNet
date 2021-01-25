# Work with Java from cmd

status: В процессе
format: stage
tegs: #java #programming 
need to know: -

---

### Основные команды работы с javac и java:
```bash
javac <ClassName>.java #компиляция файла в байт код
javac -d <../classes> <ClassName>.java #компиляция файла в указанную дирректорию

java <ClassName> #запуск java-программы
java -classpath <../classes> <ClassName> #поволяет запуситить java программу из другой папки


```
 
 
 ## Компиляция нескольких файлов и пакеты
 
 **Если вы не используете пакеты:**
 - При компиляции файла, вызывающего другой файл, скомпилируются оба файла, но это будет лишь в случае, если исходный кода другого файла будет находиться в той же дирректории, где и наш основной файл.
 - При запуске java file, требующего другой java file, эти файлы должны находиться в одной дирректориии.

**Если вы используете пакеты:**
#task дополнить

## JAR-архивы
\- JAR-архивы - это упокованные java классы, которые можно сделать **исполняемыми**.

Чтобы запустить jar-архив, нужно использовать *манифест*, который помещается в JAR и содержит информацию о файлах приложения. Он должен указать JVM, в каком классе содержиться метод main().


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