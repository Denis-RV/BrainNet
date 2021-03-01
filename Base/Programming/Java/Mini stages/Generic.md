# Generic
tegs: #java 

---
## Понятие Generic
\- Обобщенный тип или параметриизированный класс. При создании экземпляра класса можно указать тип объектов, которые будут использованы в классе. Для этого нужно рядом с названием класса поставить угловые скобки и указать в них букву `T` (можно любую букву, но принято T).

```java
public class Box<T> {
	private T object;
}
```

Generic'и позволят нам следующее:
- Избавлятся от необходимости явного приведения типов:
	```java
	int sum = (int) box.getObject()
	```
- Компилятор не позволит нам присвоить то, что ему присваивать нельзя, например присвоить объекту типа \<Integer\> строку. То есть нам не нужно это проверять через instanceof.

В случае, если мы не указываем тип параметра в `<>`, то вместо `T` автоматически подставиться класс `Object`.

**Мы также можем указать множество параметров: `<T, K, V>`**

### Продвинутые параметры 
Мы можем использовать тип классов, которые будут наследоваться от другого клаасса:
`<T extends Number>`

Также мы можем использовать только те типы, которые реализуют указанные интерфейсы. Это делается с помощью знака `&`:
`<T extends Number & Comparable<T> & Serializable>`

***Это позволяет нам использовать методы интерфесов!***

### WildCard (Маска)
\- параметр `?`, обозначающий, что тип параметра может быть любым.
Если мы хотим сравнивать между собой объекты разных типов, мы можем воспользоваться следующей конструкцией:
`compare(Box<?> another)`
Также мы можем наложить некоторые агроничения:
`compare(Box<? extends Number> another)`

**Разница между List\<Number\> и List/<\? extends Number\>** заключается в том, что в первом случае мы не можем использовать list\<Integer\>, т.к. коллекция типа Integer не наследуется от коллекции типа Number.
### Параметризированные методы
Чтобы создать такой метод, который мог бы возвращать параметризированный объект, нам надо не только написать любую букву перед названием метода, но и заключить эту же букву отдельно в триугольные скобочки:
```java
public static <U> U getElement(List<U> list) {...}
```

Приставка \<U\> означает, что метод параметризирован. Это также надо использовать для аргументов:
```java
public static <T> void transfer(List<T> src, List<T> dst) {...}
```

***Коллекция источник может быть либо типом T, либо ее наследником, но коллекция назначения может быть либо типом T, либо его родителем.
```java
public static <T> void transfer(List<? extends T> src, List<? super T> dst) {}
```