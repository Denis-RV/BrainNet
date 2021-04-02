# Конструкции в Java
теги: #java 

---
### try-witch-resources
Данная конструкция позволяет в скобках создавать класс, который нужно будет закрыть. Ее можно применять ко всем классам, которые реализуют Ее вид:
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
### Исключения try-catch-finally
Синтаксис:
```java
try {
	//code, whitch throw exception
} catch (NullPointerException  e) {
	//what will happend, if exception cathced
} catch (Exception e) {
	//what wiil happend, if exception cathced
} finally {
	//wath will happend anyway
}
```
Блок finally писать не обязательно.

### Тринарный оператор:
>логическое-условие ? выражение1 : выражение2

```java
4<8 ? println("yes") : println("")