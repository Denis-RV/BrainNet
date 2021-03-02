# Input & Output
*Need to know:* [[class File]]
*status:* In process
*format:* stage
*tegs:* #java
*desckription:*

---

# Работа с файлами
Работа с файлами осуществляется с помощью [[class File]]. 

### Фильтрация файлов
Мы можем отфильтровать файлы с помощью [[class FilenameFilter]].

Пример
Выбор файлов, начинающихся на f:
```java
File[] files = directory.listFiles((dir, name) -> name.startsWith("f"));
```

### Конструкция try-with-resources
Чтобы безопасно и быстро работать с потоками ввода-вывода, был создан ([[Конструкции в Java#try-witch-resources]]).

Пример:
```java
try(InputStream inputStream = new FileInputStream(file)) {  
   int a = inputStream.read();  
 while(a != -1) {  
      System.out.print((char) a);  
 a = inputStream.read();  
 }  
} catch (IOException e) {  
   e.printStackTrace();  
}
```
# Передача ифнформации
Чтобы что-то передать, необходимо преобразовать данные в поток байтов. Для эффективности стоит использовать буфферные оболочки классов. **Работа буффера:** при работе с этими классами мы заправшиваем у системы 8 кб данных для буффера, система в свою очередь запрашивает 8 кб данных из файла. Так в нашеф буффер-классе появляется буффер, из которого мы можем быстро читать данные по байтам. Без буфффера нам бы пришлось заправшивать байты сначала у системы, затем из файла.

==Преобразование данных в байты== осуществляется с помощью 
- [[abstract class InputStream]]
- [[class BufferedInputStream]]
- [[abstract class OutputStream]]
- [[class BufferedOutputStream]]

==Чтение файлов и запись в них== осуществеятся с помощью 
- [[class FileInputStream]]
- [[class FileOutputStream]]

==Преобразование данных в символы== осуществляется с помощью 
- [[abstract class Reader]]
- [[class BufferedReader]]
- [[class InputStremaReader]]
- [[abstract class Writer]]
- [[class BufferedWriter]]
- [[class OutputStreamWriter]]

==Вывод и ввод в консоле== 
- System.in - ввод через консоль (InputStream)
- System.out - вывод через консоль



## Проблемы при чтении файлов
- **Проблема чтение файлов с помощью массива байтов**
	Когда мы читаме файл с помощью массива байтов, записывая эти байты в строку, нам необхоидмо использовать перегруженный конструктор String с тремя аргументами. Иначе в него будут записываться дополнительные байты, которые оставались в массиве.
	
	```java
	try (InputStream inputStream = new FileInputStream(file)) {  
	   byte\[\] array = new byte\[9\];  
	 int count = inputStream.read(array);  
	 StringBuilder result = new StringBuilder();  
	 while(count>0) {  
		  result.append(new String(array, 0, count));  
	 count = inputStream.read(array);  
	 }  
	   System.out.println(result);  

	} catch (Exception e) {  
	   e.printStackTrace();  
	}
	```
- **Проблема чтения кирилицы побайтово**
	Мы не можем читать кирилицу побайтово, т.к. она занимает болльше одного байта. Чтобы читать кирилицу, необходимо воспользоваться Reader, которые читает данные посимвольно.
