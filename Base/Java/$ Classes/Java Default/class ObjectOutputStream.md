# class ObjectOutputStream
*extends:* [[class OutputStream (abstract)]]
*implements:*
*tegs:* #javaClass #java
*description:* Сериализирует объекты. В качестве параметра принимает [[class OutputStream (abstract)]]. Чтобы сериализировать класс, он должен наследовать [[interface Serializable]], и его родители должны тоже быть сериализуемыми, либо содержать конструктор без параметров. Это также должны делать все ссылочные переменные в нем. Либо же их можно пометить словом ==transient==.

---
### Методы класса:
- writeObject(Object object) - сериализует объект.
### Примеры использования:
