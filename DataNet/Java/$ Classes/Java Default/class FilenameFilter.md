# class FilenameFilter
**tegs:** #javaClass #java
**description:** 

---
### Методы класса:
- 

### Примеры:
Выбор файлов, начинающихся на f:
```java
File[] files = directory.listFiles((dir, name) -> name.startsWith("f"));
```