# Важные тонкости java
*desckription:* Опасные моменты, в которых легко допустить ошибку.

---
## String, StringBuilder или StringBuffer?
**String** - иммутабельный(неизменяемый). Когда мы как-то меняем String, то создается новый String.

**StringBuilder:** — класс, представляющий последовательность символов. Он очень похож на StringBuffer во всем, кроме потокобезопасности. Это `mutable` класс, т.е. изменяемый. Объект класса может содержать в себе определенный набор символов, длину и значение которого можно изменить через вызов определенных методов.

**StringBuffer** - тот же StringBuilder, но с синхронизированными методами для потокодбезопасности.

### Проблема чтение файлов с помощью массива байтов
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