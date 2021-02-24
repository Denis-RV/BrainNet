Пример:
```java
Set<Car> cars = new TreeSet<>(new Comparator<Car>() {  
    @Override  
 public int compare(Car o1, Car o2) {  
        return o1.getBrand().compareTo(o2.getBrand());  
 }  
});
```

---
#java #javaClass 