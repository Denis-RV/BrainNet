# Важные тонкости java
*описание:* Опасные моменты, в которых легко допустить ошибку.
*теги:* #java 

---
## String, StringBuilder или StringBuffer?
**String** - иммутабельный(неизменяемый). Когда мы как-то меняем String, то создается новый String.

**StringBuilder:** — класс, представляющий последовательность символов. Он очень похож на StringBuffer во всем, кроме потокобезопасности. Это `mutable` класс, т.е. изменяемый. Объект класса может содержать в себе определенный набор символов, длину и значение которого можно изменить через вызов определенных методов.

**StringBuffer** - тот же StringBuilder, но с синхронизированными методами для потокобезопасности.

### Проблема чтение файлов с помощью массива байтов
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

## Сериализация
- При десериализации не вызывается конструктор.
- Если после сериализации объекта в класс были внесены изменения, то десериализовать его уже не получится.
- Чтобы сериализовать объект, его родтили тоже должны быть серилизуемыми, либо содержать конструктор без параметров.
- ==serialVersionUID== - номер версии класса. По нему java ориентируется в версиях объекта. Добавьте это число в класс, и тогда его можно будет десериализировать после изменения в структуре класса. **Это делается в частности для того, чтобы при передачи сериализированных классв на другой компьютер не возникло проблем, т.к. на другом компьютере может быть другая jvm. В таком случае одинаковые классы могут иметь разные идентификаторы**