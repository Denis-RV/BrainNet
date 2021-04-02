# class CountDownLatch
**теги:** #java
**описание:** Счетчик для потоков. В качестве параметро ждет число потоков, окончания которых мы ждем. 

---
### Возможности:
- 
### Методы класса:
- countDown() - уменьшает значение. Обычно это используют в конце метода run() дочерних потоков, чтобы понять, что они завершились.
- await() - аналогичко join() останавливает работку главного потока до тех пор, пока значение countDownLatch не станет равно нулу.

### Примеры использования:

```java
CountDownLatch countDownLatch = new CountDownLatch(10);  
  
for (int i = 0; i < 10; i++) {  
    final int index = i;  
	new Thread(new Runnable() {  
		@Override  
		public void run() {  
			countDownLatch.countDown();  
		}  
	});  
}
```