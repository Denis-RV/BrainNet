# Collection Framework
*Need to know:* 
*status:* In process
*format:* stage
*tegs:* #java 
*desckription:* 

---
### Сложность алгоритмов
![[Pasted image 20210131211823.png]]
### Иерархия классов: 
![](https://cdn.javacodeexamples.com/wp-content/uploads/java-collections-cheat-sheet.png)

- [[interface Map]]
	- [[class Hashtable]]
	- [[class HashMap]]
	- [[class LinkedHashMap]]
	- [[interface SortedMap]]
		- [[class ThreeMap]]
- [[interface Set]]
	- [[class HashSet]]
		- [[class LinkedHashSet]]
	- [[interface SortedSet]]
		- [[class TreeSet]]
- [[interface List]]
	- [[class ArrayList]]
	- [[class LinkedList]]
	- [[class Vector]]
		- [[class Stack]]
- [[interface Queue]]
	- [[class PriorityQueue]]
	- [[interface Deque]]
		- [[class ArrayDque]]

### Делаем возможность перебирать элементы с помощью foreach
Для этого необходимо реализовать [[interface Iterable''T'']], а именно метод iterator(). В этом же обхекте надо создать анонимный класс и прееопределить у него методы hasNext() (проверка, есть ли еще элементы в коллекции) и next() (возвращает следующий элемент).:
```java
public Iterator<Object> iterator() {
	return new Iterator<Object>() {
	@Override
	public boolean hasNext() {
		return false;
	}
	
	@Override
	public Car next() {
		return null;
	}
}
```

#TODO добавить инфу про equals(), hashcode, iterator...