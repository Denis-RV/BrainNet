 ## Multithreading base
status: В процессе
format: stage
tegs: #programming #java

---
## Работа с потоками
### Создание потока
\- Поток можно создать с помощью [[class Thread]], в конструктор которого нужно передать класс, реализующий [[interface Runnable]].
```java 
Thread t = new Thread(new Runnable() {
	@Override
	public void run() {
	//Метод, выполняющийся после запуска потока
	} 
}
t.start(); #запус потока
```

Вместе с потоком должна быть задача, которую он выполняет, иначе поток умрет. Поток выполняется отдельно, то есть имеет свой стек вызовов. Главный поток на дне стека содержит метод `main()`. 

### Чередование потоков
- Чередование потоков можно контролировать с помощью метода `Thread.sleep(long milliSec)`. (поток приостанавливается, и планировщик задач передает управление другому потоку). 
  
  Этот метод может вызвать ислкючение `InterruptedException`. После приостановки поток станет работаспособным, но не сразу начнет выполнять свою работу.

- Остановить поток нельзя, но можно послать ему сигнал для остановки. Чтобы это сделать, нужно в методе `run()` написать следующее: 
	```java
	run() {
		Thread current = Thread.currentThread(); 
		while (!current.isInterrupted()) { 
		//код для run() 
		} 
	}
	```
	И для остановки работы потока нужно написать `thread.interrupt()`; где `thread` - наш дочерний поток. 

### Проблемы потоков
- **Параллелизм** - когда два или более потока имеют доступ к данным одного объекта. Чтобы быть уверенным, что, запустив метод наш поток будет иметь возможность завершить его, прежде чем другой поток сможет начать работу с этими же данными, нужно пометить этот метод словом `synchronized`. Это слово означает, что для работы с отмеченным кодом требуется ключ. Чтобы защитить свои данные, синхронизируйте методы, которые работают с этими данными. 

	*Важно! Если у объекта есть один или несколько синхронизированных методов, поток может выполнять их лишь при наличии ключа к объекту! Такие замки распространяются не на каждый метод отдельно, а на весь объект. *

- **Проблем с кэшированием.** Словом ==volatile== необходимо помечать переменные, с которыми имеют дело два и более потоков. Оно запрещает помещать заначение в кэш. Дело в том, что процессор может поместить значение переменной в кэш, и когда поток поменяет значение этой переменной, то для другово потока значение не поменяется (т.к. в медленной памяти значение не поменяется).  