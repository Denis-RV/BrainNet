# class Comparator
*extends:*
*implements:*
*теги:* #java/class 
*описание:*

---
### Возможности:
- 
### Методы класса:
- 
### Примеры использования:

```java
Set<Car> cars = new TreeSet<>(new Comparator<Car>() {  
    @Override  
 public int compare(Car o1, Car o2) {  
        return o1.getBrand().compareTo(o2.getBrand());  
 }  
});
```

