Указывает на то, что метод предназначен для тестирования ([[JUnit Api]]).

Если мы рабоатем с исключениями и ожидаем, что будет вызвано такое-то исключение, мы можем добавить параметр к этой аннотации:
```java
@Test(expected = NumberFormatException.class)  
```

---
tegs: #java #javaAnnotation