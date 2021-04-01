# class Scanner
*extends:*
*implements:*
*tags:* #java
*description:* Позволяет считывать данные определенного типа. В качетсве параметра принимает InputStream (например System.in)

---
### Возможности:
- 
### Методы класса:
- String nextLine() - возвращает прочитанную строку
- int nextInt() - возвращает прочитанное число
### Примеры использования:
- Чтение из консоли:
	```java
	Scanner scanner = new Scanner(System.in)
	scanner.nextLine()
	```