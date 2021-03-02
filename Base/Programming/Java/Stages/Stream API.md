# Stream API
*Need to know:* [[Java Base]]
*status:* Ready
*format:* stage
*tegs:* #java #dataScience #dataBase 
*desckription:* Stream API is a special stream, that helping us to add filters at data stream.

---
## What is it?
For example, we have this:
```java
List<Integer> filtered = filter(numbers, (n) -> n > 0);  
List<String> mapped = map(filtered);

private static List<String> map(List<Integer> numbers) {  
   List<String> result = new ArrayList<>();  
 for (int number : numbers) {  
      result.add(String.valueOf(number));  
 }  
   return result;  
}  
  
private static List<Integer> filter(List<Integer> list, MyPredicate predicate) {  
   List<Integer> result = new ArrayList<>();  
 for (int i : list) {  
      if (predicate.test(i)) result.add(i);  
 }  
   return result;  
}
```

The big code can be changed to this: 
```java
List<String> list = numbers.stream()  
      .filter(i -> i % 2 \== 0)  
      .map(integer -> String.valueOf(integer))    
      .collect(Collectors.toList());
```

filter, map - промежуточные операторы. Чтобы они волнолинись, необходиом в конец добавить завершающий оператор collect(...)


### Способы создания Stream-а
1. С помощью вызова метода stream() или parallelStream() коллекции.
2. Создать стрим из масива с помощю Array.stream(array).
3. С помощью статических методов класса 

### stream() or parallelStream()?
parallelStream() позволяет быстрее работать со стримом благодаря распаралеливанию потока данных, но **в таком случае порядок элементов будет нарушаться**. Также в parallelStream() при использование findFirst будет ловить не обязательно первый элемент в потоке.

## Операторы в Stream API
Все операторы в Stream API делятся на:
- Промежуточные (делают действия с потоком и возврщают поток данных. Их может быть сколько угодно). ==Эти методы возврщащают Stream!==
- Терминальные (завершающие выполнение потока. Может быть лишь один).

### Промежуточный операторы:
- filter() - прогоняет через фильтр каждый объект коллекции. Необходимо определить условия, когда наш объект будет возврщать true, а когда false.
- map() - делает некие преобразования над каждым элементом коллекции и возвращает любой тип данных.
- limit() - ограничивает длину потока. Мы указываем количество элементов, которые можно пропустить дальше.
- sorted() - сортирует элементы с помощью [[class Comparator]].	
	Пример:
	```java
	users.stream()  
      .sorted((o1, o2) -> Integer.compare(o2.getAge(), o1.getAge()))  
      .limit(3)  
      .forEach(System.out::println);
	```
### Терминальные операторы:
- collect(...) - собирает данные из потока. 
	Например, если нам надо соборать коллекию:
	```java
	List<String> result = list.stream()  
      .filter(n -> n % 5 \== 0 && n % 2 \== 0)    
      .collect(Collectors.toList());
	```
- long count() - возвращает количество отавшихся элементов в потоке данны.
- boolean allMatch() - если все элементы соответствует условиямм, возвращаем true, иначе false.
- boolean anyMatch() - если хотя бы один элемент соответсвует условиям, возвращаем true, иначе false.
- boolean noneMatch() - если нет ни одного элемента, подходящего по условиям, возврщает true, иначе false.
- foreEach() - берет каждый элемент из потока и делает с ним что-нибудь.
- Optional max() - возвращает наибольшее значение (определяется с помощью [[class Comparator]]). Возвращаемый тип -  - это обертка
- findFirst() - возвращает первый элемент в потоке.
- findAny() - возвращает один любой элемент в потоке.


## Сокращения
Когда в функциоанльном интерфейсе мы используем один метод, то мы можем использовать еще более сокращенную записть, записав название класса и название метода через `::`.
Например:
```java
//.map(integer -> Math.sqrt(integer))
.map(Math::sqrt)
```