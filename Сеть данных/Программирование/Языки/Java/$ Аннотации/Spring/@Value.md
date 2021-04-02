Используется для внедрения строк и других значений. В этом случае в сеттерах нет необходимости.
Есть два способа:
1. Hardcoded вариант
	```java
	@Value("Pavel")  
	private String surname;  
	@Value("33")  
	private int age;
	```
1. Вариант с properties файлом
	Создаем файл application.properties:
	```txt
	person.surname \= Dima  
	person.age \= 25
	```
	Добавляем в XML файл:
	```xml
	<context:property-placeholder location\="classpath:application.properties"/>
	```
	Добавляем к переменным:
	```java
	@Value("${person.surname}")  
	private String surname;  
	@Value("${person.age}")  
	private int age;
	```

---
*теги:* #java/annotation #spring/annotation 