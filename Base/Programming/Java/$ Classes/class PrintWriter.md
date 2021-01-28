# class PrintWriter
**extends:** 
** implements:** 
tegs: #javaClass 

---

>Позволяет записывать текст построчно в файл. В конструктор обычно принимает 

### Возможности:
- 
### Методы класса:
- `println(String x)` - Записывает строчку в файл. Строка может не записаться, если не закрыть поток (`writer.close()`)

### Примеры использования:
- Можно поместить в [[class BufferedWriter]]:
	```java
	BufferedWriter writer = new BufferedWriter(new PrintWriter("Testing\_file.txt"));
	writer.write("My name is Kris");
	writer.close();
	```