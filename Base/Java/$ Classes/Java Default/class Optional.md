# class Optional <...>
**tegs:** #javaClass #java
**description:** Класс-обертка или контейнер. 

---

### Методы класса:
- get() - выводит содержимый в себе объект.
- isPresent() - возвращает true, если в Optional что-то есть
- ifPresent(Consumer action) - проверяет конйнер как isPresent() и позволяет написать код, который будет работать с объектом внутри Optional:
```java
oldest.ifPresent((new Consumer<>() {  
   @Override  
 public void accept(User user) {  
      System.out.println(user);  
 }  
}));

/* то же самое в функциональном стиле:
oldest.ifPresent((System.out::println));
*/
```
- ifPresentOrElse(Consumer action, Runnable emptyAction) - то же. что и ifPresent, но с обработкой случая, если контейнер пустой. Этот метод можно использовать прямо в потоке Stream API.
