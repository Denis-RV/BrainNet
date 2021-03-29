# class HashMap
**extends:** 
**implements:** 
**tags:** #java
**description:**  Двумя основными отличиями от `Hashtable` являются то, что `HashMap` не синхронизирована и `HashMap` позволяет использовать `null` как в качестве ключа, так и значения. Данная коллекция не является упорядоченной: порядок хранения элементов зависит от хэш-функции. Добавление элемента выполняется за константное время O(1), но время удаления, получения зависит от распределения хэш-функции. В идеале является константным, но может быть и линейным O(n). Объекты хранятся парами ключ-значения. При добавлении нового значения по уже существующему ключу, старое значение удаляется и заменяется новым.

---
### Реализация 
Реализация схожа с [[class HashSet]]. Создается массив из 16 элементов и при добавление кода вычисляется хеш-код ключа. Внутри коллекции есть внутренний класс Entry, который содержит объект-ключ, объект-значение и ссылку на следующий объект.

#### *Преимущества:*
-  Исключает дубликаты key-значений
-  Сложность получения по ключу O(1)

#### *Недостатки:*


### Методы класса:
- put(K key, V value) - put bundle key-value
- get(K key) - returns the value to which the specified key is mapped, or null if this map contains no mapping for the key.
- size() - return the number of key-value.
- keySet() - returns a Set view of the keys.
- values() - returns a Collection view of the values.

### Примеры использования: