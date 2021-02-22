# Lambda Expression
*Need to know:* [[Java Base]]
*status:* In process
*format:* stage
*tegs:* #java #programming #spring 
*desckription:*

---
## Функциональные интерфейсы
\- это интерфейсы с одним абстрактным методом. Именно с этими интерфейсами вы можете использовать лямбда-выражения.

***Пример 1:***
```java
new Thread(() -> System.out.println(1)).start();
```
**Что означает:**
```java
new Thread(new Runnable() {  
	@Override  
	public void run() {  
		System.out.println(1);  
	}  
}).start();  
```
*Здесь когда мы передаем объект анонимного класса Runnable, то мы знаем, что будем переопределять лишь один метод, поэтому слово @Override можно убрать. Мы также знаем, что метод называется run, что он публичный и не возвращает значений, это тоже убираем. Еще мы знаем, что конструктор класса Thread принимает объект класса Runnable и указывать это явно не имеет смысла. Т.к. явное создание фнонимного класса убрано, можно убрать фигурные скобки. Теперь, после указания списка параметров мы можем поставить стрелку и пишем все в одну строчку. Раз у нас одна строка кода, мы можем убрать фигурные скобки и точку с запятой.*

Когда мы создаем новый поток, нам достаточно передать метод, который должен выполняться в другом потоке.

==Функциональные интерфейсы необходимо помечать аннотацией [[@FunctionalInterface]]==
Благодаря этой аннотации компилятор будет следить за тем, чтобы в интерфейсе был один абстрактный метод, и если кто-то добавит новый, то программа не собереться. 

***Пример 2:***
```java
System.out.println(new Director().jobStart((n) -> {  
    for (int i = 0; i < n; i++) {  
        System.out.println("I'm working");  
 }  
    return "Success";  
}, 5));
```
**Что означает:**
```java
Worker worker = new Worker() {  
    @Override  
 public String work(int count) {  
        for (int i = 0; i < n; i++) {  
            System.out.println("I'm working");  
 }  
        return "Success";  
 }  
}  
Director director = new Director();  
String result = director.jobStart(worker, 5);  
System.out.println(result);  
```
  
  
### Избавляемся от return
Если наш код состоит из одной строчки и он возвращает что-то, мы можем сделать так:
```java
System.out.println(filter(numbers, (a) -> (a%5\==0)));
```
что означает:
```java
System.out.println(filter(numbers, (a) -> {  
   return (a % 5 == 0);  
}));
```

