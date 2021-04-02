  # Dependency Injection

*необходимо знать:* [[Inversion of Control]], [[Bean]]
*теги:* #spring #java 

---
# Избавляемся от ручного внедрения зависимостей.
Как сделать так, чтобы зависимость music не нужно было внедрять вручную и создавать объект musicPlayer?

```java
Music music = context.getBean("musicBean", Music.class);
MusicPlayer musicPlayer = new MusicPlayer(music);
```

### Вспомним типичные шаги в работе со Spring:

- Создаем Java - классы (будущие бины)
- Создаем и связываем бины с помощью Spring (аннотации, XML или Java код)
- Все объекты (бины) берутся из Spring Container (Application Context)

## Способы внедрения зависимостей:

- Через конструктор
- Через setter
- С помощью множества конфигураций (scope, factory method and other)
- Через XML, аннотации или Jav - код
- Процесс внедрения можно автоматизировать (Autowiting)

### Пример Dependency Injection через конструктор и ссылки:

```xml
<bean id="musicBean"
      class="org.example.PopMusic">
</bean>

<bean id="musicPlayer"
      class="org.example.MusicPlayer">
      <!-- В конструктор MusicPlayer необходимо передать объект musicBean. В нем нет конструктора без аргументов  -->
      <constructor-arg ref="musicBean"/>
</bean>
```

> Мы создаем бин класса PopMusic и бин класса MusicPlayer. Затем передаем в конструктор класса MusicPlayer бин PopMusic.

### Dependency Injection через Setter:

![Dependency%20Injection%2087375ca0a0964c3c8deb222d3d09d206/Untitled%201.png](Untitled%201%201%201.png)

> Создаем объект MusicPlayer с пустым конструктором, затем spring с помощью сеттера назначает зависимый объект

ВАЖНО: Наименования сеттеров должны строго соответствовать, так как от этого зависит работа Spring. Если мы имеем сеттер setColor, то в \<property name> в качестве значения name мы указываем **color**.  Spring избавляется от слова set в сеттере, и меняет регистр первой буквы.

### Простые значения:

![Dependency%20Injection%2087375ca0a0964c3c8deb222d3d09d206/Untitled%202.png](Untitled%202%201.png)

### Внедрение значений из внешнего файла:

![Dependency%20Injection%2087375ca0a0964c3c8deb222d3d09d206/Untitled%203.png](Untitled%203%201.png)
	
classpath - местонахождение пользовательских классов, которые видит система. В него входит файл resources.

Также можно внедрять коллекции:

```xml
<property name="musicList">
            <list>
                <ref bean="popBean"/>
                <ref bean="classicalBean"/>
                <ref bean="rockBean"/>
            </list>
</property>
```
	
### Внедрение с помощью Scope.
Scope (область видимости) определяет:
- жизненный цикл бина
- возможное количество создаваемых бинов.

#### 1. Singlton

- Singlton - Scope, который используется по умолчанию (он создается еще до вызова метода getBean(), то есть сразу после прочтения Sprigng Container-ом конфиг файла.
- при всех вызовах getBean() возвращается ссылка на один и тот же единственный объект.

![[Pasted image 20210226002909.png]]

Singltone используется, когда мы точно знаем, что наш бин не будет изменяться в процессе выполнения программы.

### 2. Prototype

- Каждый раз создает новый объект при вызове getBean() (и создание происходит после обращения к Spring Container-у с помощью getBean()).
- подходит для stateful объектов
- напоминает [[$- Паттерн Prototype]]

![Dependency%20Injection%2087375ca0a0964c3c8deb222d3d09d206/Untitled%205.png](Untitled%205%201.png)

Чтобы им воспользоваться, необходимо написать так:

```xml
<bean id="musicBean"
			class="ru.alishev.ClassicalMusic"
			scope="prototype">
</bean>
```

### 3. Request

### 4. Session

### 5. Global-session

### 6. [[Bean#Внедрение бинов с помощью init-method и destroy-method]]

### Внедрение бинов с помощью factory method
	
	
---
## See next:
- [[Bean]]
- [[AOP]]