# class FilenameFilter
**теги:** #java/class 
**описание:** 

---
### Методы класса:
- 

### Примеры:
Выбор файлов, начинающихся на f:
```java
File[] files = directory.listFiles((dir, name) -> name.startsWith("f"));
```