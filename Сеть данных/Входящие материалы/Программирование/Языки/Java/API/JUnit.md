# JUnit-testing
*необходимо знать:*
*теги:* #java 
*описание:* Библиотека для написания авто-тестов. Требует добавление зависимости с помощью [[$- Gradle]] и [[Maven]].

---
## Написание автоматизированных JUnit-тестов
1. Вам необходимо подключить зависимости с помощью Maven или Gradle. В Gradle зависимость JUnit добавлена по умолчанию.
2. Навести курсор на класс для теста, нажать `Ctrl+Alt`, выбрать `Create Test`, выбрать Junit4 и выбрать методы для тестирования.
3. Методы, помеченные аннотацией `@Test` предназначены для тестирования. В этих тестах нужно написать две переменные - 1)значение, которое мы хотим получить, 2) реальное значение, которое мы получим (здесь необходимо создать объект тестируемого класса и использовать тестируемый метод). Далее мы сравниваем эти переменные с помощью метода `assertEquals(var1, var2)`:
	```java
	@Test  
	public void plus() {  
		Calculator cal = new Calculator();  
		int expected = 15;  
		int result = cal.plus(10, 5);   
		assertEquals(expected, result);  
	}
	```
	
	Таким образом мы можем быстро и легко писать много тестов.
	==Тесты с дробными числами== - При тестирование дробных чисел (double, float) необходимо добавлять 3 параметр - учет погрешности, т.к. у языка есть особенность в процессе деления, когда добавляется или отнимается микро доля:
	```java
	@Test  
	public void mult() {  
		double expected = 45;  
		double result = cal.mult(9, 5);  
		assertEquals(expected, result, 0.0001);    
	}
	```

***Представленные выше примеры - плохой тон!*** На практике тестам дают очень информативное название (when5AddTo10AsStringThenResult15) и для каждой проверки делают отдельный тест. Первый пример должен выглядеть так:
```java
@Test  
public void whenAddHundredToFiftyThenResultHundredFifty() {  
    int expected2 = 150;  
 int result2 = cal.plus(100, 50);  
 assertEquals(expected2, result2 );  
}  
  
@Test  
public void whenAddTenToFiveThenResultFifteen() {  
    int expected = 15;  
 int result = cal.plus(10, 5);  
 assertEquals(expected, result);  
}
```

### Выполнение действий до и после теста
Если вам необходимо добавить что-то в класс для тестов (переменные или методы), то необходимо воспользоваться аннотацией [[Сеть данных/Входящие материалы/Программирование/Языки/Java/Библиотеки/Java аннотации/lib/@Before]]. Код, находящийся в методе помеченным этой аннотацией, будет выполняться отдельно для каждого теста:

```Java
Calculator cal;  
  
@Before  
public void setUp() {  
    cal \= new Calculator();  
}
```

Если же вам необходимо что-то сделать после завершения тестов, используйте аннотацию [[@After]]:
```java
@After  
public void close() {  
    cal \= null;  
}
```
 
### Тесты на проверку исключений
Если нам нужно проверить, вызывается ли исключение при определенной ошибки, то мы можем написать следующее:

```java
@Test  
public void whenInputIncorrectValueThenThrowException() {  
    boolean wasException = false;  
 try {  
        cal.plus("hello", "3");  
 } catch (Exception e) {  
        wasException = true;  
 }  
    assertTrue(wasException);  
}
```

Но этот код слишком большой и его можно упростить, немного изменив аннотацию [[@Test]]:
```java
@Test(expected = NumberFormatException.class)  
public void whenInputIncorrectValueThenThrowException() {  
    cal.plus("hello", "3");  
}
```