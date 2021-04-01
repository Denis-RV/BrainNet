# Input & Output
*Need to know:* [[class File]] 
*tags:* #java
*description:*

---

# Работа с файлами
Работа с файлами осуществляется с помощью [[class File]]. 

### Фильтрация файлов
Мы можем отфильтровать файлы с помощью [[$ class FilenameFilter]].

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
# Передача информации
Чтобы что-то передать, необходимо преобразовать данные в поток байтов. Для эффективности стоит использовать буферные оболочки классов. **Работа буфера:** при работе с этими классами мы запрашиваем у системы 8 кб данных для буфера, система в свою очередь запрашивает 8 кб данных из файла. Так в нашем буфер-классе появляется буфер, из которого мы можем быстро читать данные по байтам. Без буффера нам бы пришлось запрашивать байты сначала у системы, затем из файла.

==Преобразование данных в байты==
- [[class InputStream (abstract)]]
	- [[$ class BufferedInputStream]] - буфер
	- [[$ class FileInputStream]] - основная реализация
- [[class OutputStream (abstract)]]
	- [[$ class BufferedOutputStream]] - буфер
	- [[$ class FileOutputStream]] - основная реализация

==Преобразование данных в символы==
- [[class Reader (abstract)]] 
	- [[$ class BufferedReader]] - буфер
	- [[class InputStremaReader]] - основная реализация
	- [[$ class FileReader]] - для текстовых файлов
- [[class Writer (abstract)]] 
	- [[$ class BufferedWriter]] - буфер
	- [[class OutputStreamWriter]] - основная реализация
	- [[$ class FilleWriter]] - для текстовых файлов

==Сериализация объектов== ([[$- Сериализация объектов]])
- [[$ class ObjectOutputStream]] - сериализация
	- [[interface Serializable]] - сериализуемые объекты должны имлементировать этот интерфейс.
	- [[interface Externalizable]] - если надо изменить сериализацию (зашифровать).
- [[$ class ObjectInputStream]] - десериализация

==Вывод и ввод в консоли== 
- System.in - ввод через консоль (InputStream)
- System.out - вывод через консоль 


==Доступ к определенному месту в файле==
- [[$ class RandomAccessFile]]

## Проблемы при чтении файлов
- **Проблема чтение файлов с помощью массива байтов**
	Когда мы читаем файл с помощью массива байтов, записывая эти байты в строку, нам необходимо использовать перегруженный конструктор String с тремя аргументами. Иначе в него будут записываться дополнительные байты, которые оставались в массиве.
	
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
	Мы не можем читать кириллицу побайтово, т.к. она занимает больше одного байта. Чтобы читать кириллицу, необходимо воспользоваться Reader, которые читает данные посимвольно.


