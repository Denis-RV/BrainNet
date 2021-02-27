 # Bean

need to know: [[Dependency Injection]]
status: В процессе
format: stage
tegs: #programming #spring #java

---
## Bean

1. Это простой Java объект.
2. Когда java объекты создаются с помощью Spring'а, они называются бинами (beans).
3. Бины создаются из Java классов (так же, как и обычные объекты

![Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%201.png](Images/Programming/Spring%20Framework/Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%201.png)

### Bean Lifecycle (жизненный цикл бина)

![Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%202.png](Images/Programming/Spring%20Framework/Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%202.png)

### Внедрение бинов с помощью init-method и destroy-method

==Init-method==

- Метод, который запускается в ходе инициализации бина.
- Инициализация ресурсов, обращение к внешним файлам, запуск БД.

==Destroy-method==

- Метод, который запускается в ходе уничтожения бина (при завершении приложенияя)
- Очищение ресурсов, закрытие потоков ввода-вывода, закрытие доступа к БД.

```xml
<bean id="musicBean"
			class="ru.alishev.spring.ClassicalMusic"
			init-method="doMyInit"
			destroy-method="doMyDestroy">
</bean>
```

Данные методы создаются внутри класса бина (ClassicalMusci).

#### Тонкости init и destroy методов

![Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%203.png](Images/Programming/Spring%20Framework/Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%203.png)

![Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%204.png](Images/Programming/Spring%20Framework/Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%204.png)

## Factory-method

![Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%205.png](Images/Programming/Spring%20Framework/Bean%20ca7b701378db4e89810fa2fa29d93275/Untitled%205.png)

---
### See next:
- [[Dependency Injection]]