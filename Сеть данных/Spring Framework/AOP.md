# Aspect Oriented Programming
*Need to know:* [[Dependency Injection]]
*tags:* #spring #java 
*description:*

---
# Aspects
***AOP*** - парадигма программирования, основанная на идее разделения основного и служебного функционала. Служебный функционал записывается в Aspect-классы. 

В основе ==Aspect== заключена сквозная логика (cross-cutting logic).

К ==сквозному== (служебному) функционалу остносят:
- логирование
- проверка прав (security check)
- обработка транзакций
- обработка исключений
- кэширование
- И т.д.

Благодаря сквозной логике мы можем создавать Aspect классы с методами сквозной логики (метод для логирования, метод для проверки прав доступа). AOP использует [[$- Pattern Proxy]].

АOP Frameworks состоит из:
- Spring AOP - предоставляет самую распространенную и необходимую функциональность AOP. Простой в использовании.
- AspectJ - предоставляет всю функциональность AOP. Более сложный в использовании.

### Преимущества:
- Сквозной функционал сосредоточен в 1-м или нескольких обособленных классах. Это позволяет легче его изменять.
- Становится легче добавлять новые сквозные работы для нашего основного кода или имеющиеся сквозные работы для новых классов. Это достигается благодаря конфигурации аспектов.
- Бизнес-код приложения избавляется от сквозного кода, становится меньше и чище, упрощает работу.

### Недостатки
- Дополнительное время на работу аспектов.

## Advice

==Advise== - метод, который находится в аспект-классе и который определяет, что должно происходить при вызове методов бизнес-логики, в которых должен быть сквозной функционал

Типы Advice:
- **Before** ([[Сеть данных/Java/$ Annotations/Spring/@Before]]) - выполняется до метода с основной логикой.
- **After returning** - выполняется после нормального окончания метода с основной логикой.
- **After throwing** - выполняется после окончания метода с основной логикой если было выброшено исключение.
- **After/After finally** - выполняется после окончания метода с основной логиков в любом случае.
- **Around** - выполняется до и после метода с основной логикой.


# Создаем аспект для логирования
==Aspect== - это класс, отвечающий за сквозную функциональность.

Необходимо проделать следующие действия:
1. Добавить в MyConfig.class аннотацию [[@EnableAspectJAutoProxy]].
2. Создаем класс-Aspect (класс, помеченный [[@Aspect]]), добавляем в него advice-метод.
3. Помечаем advice-метод одним из типов Advice и указываем основной класс, в котором будет выполняться сквозная логика (Pointcut).
	```java
	@Before("execution(public void getBook())")  
	public void beforeGetBookAdvice() {  
	   System.out.println("beforeGetBookAdvice: попытка получить книгу");  
	}
	```

## Pointcut
\- выражение, описывающее где должен быть применен Advice.

Spring AOP использует AspectJ Pointcut expression language, т.к. определенные правила в написании выражений для создания Pointcut.

Шаблон Pointcut  с выделенными обязательными параметрами:
*execution(modifiers-pattern? **return-type-pattern** declaring-type-pattern? **method-name-pattern(parameters-pattern)** throws-pattern?)*
Здесь declaring-type-pattern обозначает конкретный класс, где находится метод. 

Мы можем использовать группы методов, то есть
применять WildCard, в качестве которой будет применяться `*`. Этот символ означает совпадение со всем. Звездочку мы можем использовать вместо возвращаемого типа, в названиях методах. modifiers-pattern мы можем убрать, т.к. он не обязательный.

Примеры:
![[Pasted image 20210227155539.png]]

### Параметры Pointcut
- Любые методы с любым одним параметром:
	@Before("execution(public void \*(\*))")	
- Любые методы с любым количеством любых параметров
	@Before("execution(public void \*(..))")	
	
Примеры:
![[Pasted image 20210227170820.png]]

### Объявление Pointcut
Для того, чтобы не пользоваться copy-paste когда для нескольких Advice-ов подходит один и тот же Pointcut, есть возможность объявлять данный Pointcut и затем использовать его несколько раз:
```java
@Pointcut("pointcut_expression") 
 private void pointcut_reference() {}
```
Чтобы можно было использовать Poincut в нескольких advice-ах, на него должно что-то ссылаться. В данном случае на него ссылается метод pointcut_reference(). 
Вот как он используется:
```java
@Before("allGetMethods()")  
public void beforeGetLoggingAdvice() {... }
```

**Плюсы объявления Pointcut:**
- Возможность использования созданного Pointcut для множества Advice-ос.
- Возможность быстрого изменения Pointcut expression для множества Advice-ов.
- Возможность комбинирования Pointcut-ов

### Комбинирования Pointcut-ов
Комбинирование Pointcut-ов - это их объединение с помощью логических операторов `&&`, `||`, `!`.

```java
@Pointcut("execution(\* aop.UniLibrary.get\*())")  
private void allGetMethodsFromUniLibrary() {}  
  
@Pointcut("execution(\* aop.UniLibrary.return\*())")  
private void allReturnMethodsFromUniLibrary() {}  
  
@Pointcut("allGetMethodsFromUniLibrary() || allReturnMethodsFromUniLibrary()")  
private void allGetAndReturnMethodsFromUniLibrary() {}

/* Или так:
@Pointcut("allGetMethodsFromUniLibrary() && !allReturnMethodsFromUniLibrary()")  
private void allGetAndReturnMethodsFromUniLibrary() {}
*/
```