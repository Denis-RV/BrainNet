# class String
#javaClass
---

>

**extends:** Object
** implements:** Serializable, Comparable<String>, CharSequence, Constable, ConstantDesc\
	
### Возможности:
- Как осуществляется форматирование?

### Методы класса:
- [[split(String s)]]

### Подробно о возможностях
- Как осуществляется форматирование?

Форматирование осуществляется с помощью статического методао String.format(…), куда в качестве первого аргумента подается строка, содержащая текст и спец знаки - %s (String) и %d (int). Пример:

```java
System.out.println(String.format("В г. %s сейчас полночь!", cityName));

System.out.println(String.format("В г. %s сейчас %d:%d:%d!", cityName,hours,minutes,seconds));
```