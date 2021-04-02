# class String
*implements:* [[interface Serializable]], Comparable\<String>
*теги:* #java
*описание:* String - immutable (иммутабельный(неизменяемый). Когда мы как-то меняем String, то создается новый String.

---


### Методы класса:
- split(String s) - позволяет разбивать строку на части и вносит полученные строки в массив. Метод берет символ(ы) s использует его для разделения
- format("any %s text, %s\n", string1, string2) - позволяет отформатировать текст при помощи спецификаторов.  

### Возможности
- Форматирование
	Форматирование осуществляется с помощью статического методао String.format(…), куда в качестве первого аргумента подается строка, содержащая текст и спец знаки - %s (String) и %d (int). Пример:

	```java
	System.out.println(String.format("В г. %s сейчас полночь!", cityName));

	System.out.println(String.format("В г. %s сейчас %d:%d:%d!", cityName,hours,minutes,seconds));
	```