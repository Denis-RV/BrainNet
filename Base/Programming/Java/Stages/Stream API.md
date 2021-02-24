# Stream API
*Need to know:* [[Java Base]]
*status:* In process
*format:* stage
*tegs:* #java #programming 
*desckription:*

---
## What is it?
Stream API is a special stream, that helping us to add filters at data stream. 

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


### Операторы в Stream API
Все операторы в Stream API делятся на:
- Промежуточные (делают действия с потоком и возврщают поток данных. Их может быть сколько угодно).
- Терминальные (завершающие выполнение потока. Может быть лишь один).

## Сокращения
Когда в функциоанльном интерфейсе мы используем один метод, то мы можем использовать еще более сокращенную записть, записав название класса и название метода через `::`.
Например:
```java
//.map(integer -> Math.sqrt(integer))
.map(Math::sqrt)
```