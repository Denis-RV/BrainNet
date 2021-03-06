# class ExecutroService
**extends:** 
**implements:** 
**теги:** #java/class 
**описание:** Экзекутер-сервис используется, когда требуется выполнять много разных задач в отдельных потоках. Мы можем поручать экзекутеру-сервису задания, а он будет распределять их по потоком. Если все потоки будут заняты, экзекутер-сервис добавит задания в очередь и отдаст задание первому освободившемуся потоку.

---
### Виды реализаций:
- newFixedThreadPool(int nThreads) - фиксированное колечиство потоков.
- newSingleThreadExecutor() - один поток. 
- newCachedThreadPool() - создает потоки по мере необходимости, но не удаляет их.
- submit(new Callable\<T>) - используется, если нам нужно вернуть данные из экзекутера при выполнение заданий потоками. Возвращает объект класса Future, из которого можно извлечь данные. Вместо метода run мы переопределяем метод call, который возвращает нужное нам значение:
	```java
	Future<String> futureName = executorService.submit(new Callable<String>() {
		@Override
		public String call() throws Exception {
			return "Test";
		}
	});
	
	String text = furureName.get();
	```
### Методы класса:
- execute(Runnable r) - добавление потока в сервис.
- shutdown() - завершает работу сервиса. Необходимо вызвать для окончания работы программы.
### Примеры использования:
