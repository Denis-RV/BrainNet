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


# Передача ифнформации
Чтобы что-то передать, необходимо преобразовать данные в поток байтов.

Чтобы преобразовать данные в поток байтов, необходимо воспользоваться абстрактными классами [[abstract class Inputstream]], [[abstract class OutputStream]]

## Конструкция try-with-resources
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