# Java servers & JWS
need to know: [[$ Java Base]], [[$ Base bash commands]]
status: В процессе 
format: stage
tegs: #programming #java #net

---
## Резюме: 
- Общение клинта с сервером
	- Как заставить клиента работать?
	- Что такое "сокет"? 
		- Что такое порт TCP? 
		- Как считать данные из сокета? 
		- Как записать данные в сокет? 
	- Как создать серверное приложение? 
- Java Web Start
	- Принцип работы JWS
	- JNLP-файл
	- Создание и развертывание JWS-приложения

---
# Общение клиента с сервером

### Как заставить клиента работать?
\- Для это необходимо следующее:
- инициализировать соединение между клиентом и сервером;
- отправлять сообщения на сервер; 
- принимать сообщения от сервера; 

### Что такое сокет и зачем он нужен
Соединение устанавливается с помощью *сокета*.

`Сокет` ([[class Socket]]) - это объект, представляющий сетевое соединение между двумя компьютерами, а именно между двумя узлами, программное обеспечение которых знает о существовании друг друга. Чтобы создать сокет, нужно знать о сервери две вещи: где он находится и а каком порту работает (IP-адрес и номер порта). 

**Создание сокета:**
```java
Socket socket = new Socket("196.164.1.103", 5000); 
```

 ==Порт TCP== - это 16-битное число, с помощью которого распознается конкретная программа на сервере. Номера портов с 0 по 1023 зарезервированы для популярных сервисов, их нельзя использовать. Выбирайте номер между 1024 и 65 535. 

*Чтение данных из сокета* осуществляется также, как и чтение данных из файла, но вместо [[class File]] мы используем [[class Socket]]: 
```java
Socket chatSocket = new Socket("127.0.0.1", 5000); 
Buffered reader = new BufferedReader(new InputStreamReader(chatSocket); 
String message = reader.readLine(); 
```

*Запись данных в сокет* осуществдяется с помощью класса [[class PrintWriter]]: 
```java
Socket chatSocket = new Socket("127.0.0.1", 5000); 
PrintWriter writer = new PrintWriter(chatSocket.getOutputStream()); 
writer.println("Сообщение 1"); 
writer.pritn("Сообщение 2"); 
``` 


### Серверное приложение
**Чтобы создать серверное пирложение, нам нужен [[class ServerSocket]]** который ожидает запросов со стороны клиента (когда клиент выполняет `new Socket()`), и обычный [[class Socket]] для общения с клиентом. 
```java
//сервер начнет отслеживать входящие клиенткские запросы на порту 4242: 
ServerSocket serverSocket = new ServerSocket(4242); 
Socket sock = new Socket("190.165.1.103", 4242); 
//сервер создает новый сокет для общения с клиентом: 
Socket sock = serverSocket.accept();
```

Метод `accept()` блокирует программу, пока ожидает подключения клиентского сокета. 

# Java Web Start